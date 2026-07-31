import os
import fitz
import sys
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, WebSocket, WebSocketDisconnect, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from app.database import get_db
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.models.interview import InterviewModel, InterviewFeedback
from app.crud.application import get_or_create_application, update_application_status
from app.schemas.application import ApplicationResponse, ApplicationUpdate
from app.utils.security import (
    get_current_user,
    require_permissions,
    get_job_or_403,
    get_application_or_403
)
from app.utils.ws_manager import ws_manager
from app.utils.background_workers import screen_candidate_background
from app.agents.ranking_agent import rank_candidates

router = APIRouter(prefix="/recruitment", tags=["Applications & Candidates"])

UPLOADS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads", "cvs"))
os.makedirs(UPLOADS_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────
# 1. WEBSOCKET REAL-TIME STREAMING
# ─────────────────────────────────────────────────────────────
@router.websocket("/ws/recruitment")
async def recruitment_websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


# ─────────────────────────────────────────────────────────────
# 2. PUBLIC CANDIDATE APPLY
# ─────────────────────────────────────────────────────────────
@router.post("/apply/{job_id}")
def apply_for_job(
    job_id: int,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(""),
    cv_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    pdf_bytes = cv_file.file.read()
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    cv_text = ""
    for page in doc:
        cv_text += page.get_text()

    if not cv_text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from uploaded CV PDF.")

    candidate = db.query(Candidate).filter(Candidate.email == email).first()
    if not candidate:
        candidate = Candidate(
            full_name=full_name,
            email=email,
            phone=phone
        )
        db.add(candidate)
        db.flush()
    else:
        candidate.full_name = full_name
        candidate.phone = phone

    # Save PDF file to disk
    file_path = os.path.join(UPLOADS_DIR, f"candidate_{candidate.id}_job_{job_id}.pdf")
    with open(file_path, "wb") as f:
        f.write(pdf_bytes)

    app = get_or_create_application(
        db,
        candidate_id=candidate.id,
        job_id=job_id,
        current_status="applied",
        disposition="active",
        cv_text=cv_text,
        cv_pdf_path=file_path
    )

    db.commit()

    return {
        "message": "Application submitted successfully!",
        "application_id": app.id,
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "cv_pdf_path": app.cv_pdf_path
    }


# ──── Scoped Applications list ────
@router.get("/applications/{job_id}")
def get_applications(
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db)
):
    applications = db.query(Application).filter(Application.job_id == job.id).all()
    result = []
    for app in applications:
        candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()

        result.append({
            "application_id": app.id,
            "candidate_id": app.candidate_id,
            "full_name": candidate.full_name if candidate else "—",
            "email": candidate.email if candidate else "—",
            "phone": candidate.phone if candidate else "—",
            "cv_pdf_path": app.cv_pdf_path if app.cv_pdf_path else "",
            "cv_text": app.cv_text if app.cv_text else "",
            "current_status": app.current_status,
            "disposition": app.disposition,
            "status": app.current_status,
            "match_score": app.match_score,
            "skill_gap": app.skill_gap,
            "summary": app.summary,
            "applied_at": app.created_at
        })
    return {"job_id": job.id, "total": len(result), "applications": result}


@router.put("/applications/{candidate_id}/{job_id}", response_model=ApplicationResponse)
def update_application_endpoint(
    candidate_id: int,
    payload: ApplicationUpdate,
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app = update_application_status(
        db,
        candidate_id=candidate_id,
        job_id=job.id,
        current_status=payload.current_status,
        disposition=payload.disposition,
        updated_by=current_user["user_id"]
    )
    if not app:
        raise HTTPException(status_code=404, detail="Application record not found")
    return app


# ──── Scoped Candidates list ────
@router.get("/candidates/{job_id}")
def get_candidates(
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db)
):
    applications = db.query(Application).filter(Application.job_id == job.id).all()
    result = []
    for app in applications:
        candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
        if candidate:
            result.append({
                "candidate_id": candidate.id,
                "application_id": app.id,
                "full_name": candidate.full_name,
                "email": candidate.email,
                "phone": candidate.phone,
                "current_status": app.current_status,
                "disposition": app.disposition,
                "match_score": app.match_score,
                "applied_at": app.created_at
            })
    return {"job_id": job.id, "total": len(result), "candidates": result}


# ──── View / Download Scoped Candidate CV PDF ────
@router.get("/cv-pdf/{application_id}")
def get_cv_pdf(
    app: Application = Depends(get_application_or_403)
):
    if not app.cv_pdf_path or not os.path.exists(app.cv_pdf_path):
        raise HTTPException(status_code=404, detail="CV PDF file not found on server")
    return FileResponse(app.cv_pdf_path, media_type="application/pdf")


# ──── Ranked Candidates ────
@router.get("/ranked-candidates/{job_id}")
def get_ranked_candidates(
    job: Job = Depends(get_job_or_403),
    db: Session = Depends(get_db)
):
    applications = db.query(Application).filter(Application.job_id == job.id).all()
    if not applications:
        return {"job_id": job.id, "ranked_list": [], "best_candidate": {}}

    candidates = []
    for app in applications:
        candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
        interview = db.query(InterviewModel).filter(InterviewModel.application_id == app.id).first()
        feedback = interview.feedback if interview else None

        tech_s = feedback.technical_score if feedback else 0.0
        comm_s = feedback.communication_score if feedback else 0.0

        candidates.append({
            "candidate_id": app.candidate_id,
            "application_id": app.id,
            "full_name": candidate.full_name if candidate else "—",
            "email": candidate.email if candidate else "—",
            "resume_score": app.match_score or 0.0,
            "technical_score": tech_s,
            "communication_score": comm_s,
            "final_score": app.final_score or 0.0,
            "hired": app.current_status == "hired",
            "rejected": app.disposition == "rejected",
            "interview_date": str(interview.scheduled_date) if interview else "—",
            "interview_time": str(interview.scheduled_time) if interview else "—",
            "interviewer_1": interview.interviewer_1.full_name if (interview and interview.interviewer_1) else "—",
            "interviewer_2": interview.interviewer_2.full_name if (interview and interview.interviewer_2) else "",
            "meeting_link": interview.meeting_link if interview else "",
            "evaluated_at": str(app.updated_at) if app.updated_at else "—"
        })

    result = rank_candidates(job_id=job.id, candidates=candidates)
    return {
        "job_id": job.id,
        "ranked_list": result["ranked_list"],
        "best_candidate": result["best_candidate"]
    }


# ──── Reject Application ────
@router.put(
    "/reject/{application_id}",
    dependencies=[Depends(require_permissions(["disposition_candidate"]))]
)
async def reject_application(
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    app.disposition = "rejected"
    app.updated_by = current_user["user_id"]
    db.commit()

    candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
    job = db.query(Job).filter(Job.id == app.job_id).first()

    email_sent = False
    if candidate and job:
        try:
            from mcp import ClientSession, StdioServerParameters
            from mcp.client.stdio import stdio_client

            server_params = StdioServerParameters(
                command=sys.executable,
                args=[os.path.join(os.path.dirname(__file__), "..", "mcp_servers", "meeting_email_server.py")],
            )

            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(
                        "send_rejection_email",
                        {
                            "candidate_name": candidate.full_name,
                            "candidate_email": candidate.email,
                            "job_title": job.title,
                            "company_name": job.company.name if job.company else "Company",
                            "sender_email": "nirmal.naik1994@gmail.com",
                            "sender_password": os.getenv("GMAIL_APP_PASSWORD", "")
                        }
                    )
                    email_sent = "sent" in result.content[0].text.lower()
        except Exception as e:
            print(f"MCP rejection email error: {e}")
            email_sent = False

    return {
        "message": "Candidate rejected and email sent!",
        "application_id": app.id,
        "email_sent": email_sent
    }
