from datetime import date, time, timedelta
from app.models.application import Application
from app.models.interview import InterviewSlot

def seed_applications_and_slots(db, users_context, jobs):
    print("🔹 [Level 3] Generating Candidate Applications Across ALL Stages & Interview Slots...")
    ceo_user = users_context["ceo"]
    candidates = users_context["candidates"]
    job_fs = jobs[0]  # Senior Full Stack Engineer
    job_ai = jobs[1]  # AI / ML Engineer

    # 1. Mappings representing ALL 7 PIPELINE STAGES
    # Format: (candidate, job, current_status, disposition, match_score, skill_gap, summary, final_score)
    app_mappings = [
        (candidates[0], job_fs, "applied", "active", 82.0, "Docker", "Fresh applicant. Strong React foundation.", 80.0),
        (candidates[1], job_ai, "screening", "active", 89.0, "LangChain", "Passed CV screening. Excellent ML background.", 86.5),
        (candidates[2], job_fs, "interview", "active", 94.5, "GraphQL", "Passed technical round with strong score.", 92.5),
        (candidates[3], job_ai, "offer_approval", "active", 96.0, "None", "Top AI candidate. Pending CEO offer approval.", 95.0),
        (candidates[4], job_fs, "offer_sent", "active", 91.0, "Kubernetes", "Offer letter sent to candidate via secure token.", 93.0),
        (candidates[5], job_ai, "hired", "active", 98.0, "None", "Hired successfully. Offer signed.", 97.5),
        (candidates[6], job_fs, "rejected", "rejected", 45.0, "React, FastAPI, SQL", "Unsuitable experience level for senior role.", 42.0),
    ]

    applications = []
    for cand, job, curr_status, disp, score, gap, summ, final_s in app_mappings:
        app = db.query(Application).filter(
            Application.candidate_id == cand.id,
            Application.job_id == job.id
        ).first()

        if not app:
            app = Application(
                candidate_id=cand.id,
                job_id=job.id,
                current_status=curr_status,
                disposition=disp,
                match_score=score,
                skill_gap=gap,
                summary=summ,
                final_score=final_s,
                created_by=ceo_user.id
            )
            db.add(app)
            db.commit()
            db.refresh(app)

        applications.append(app)

    # 2. Availability Slots
    slot1 = db.query(InterviewSlot).filter(InterviewSlot.slot_date == date.today() + timedelta(days=1)).first()
    if not slot1:
        slot1 = InterviewSlot(
            interviewer_id=users_context["interviewer"].id,
            job_id=job_fs.id,
            slot_date=date.today() + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(11, 0),
            is_booked=True,
            created_by=ceo_user.id
        )
        db.add(slot1)

    slot2 = db.query(InterviewSlot).filter(InterviewSlot.slot_date == date.today() + timedelta(days=2)).first()
    if not slot2:
        slot2 = InterviewSlot(
            interviewer_id=users_context["interviewer"].id,
            job_id=job_ai.id,
            slot_date=date.today() + timedelta(days=2),
            start_time=time(14, 0),
            end_time=time(15, 0),
            is_booked=False,
            created_by=ceo_user.id
        )
        db.add(slot2)

    db.commit()

    print(f"  ✓ Level 3 Complete: {len(applications)} Applications (covering all 7 stages: applied, screening, interview, offer_approval, offer_sent, hired, rejected) & 2 Interview Slots created.")
    return applications
