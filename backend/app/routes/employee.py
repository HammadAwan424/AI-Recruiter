import os
import sys
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any

from app.database import get_db
from app.models.user import User
from app.models.job import Job
from app.models.candidate import Candidate
from app.models.application import Application
from app.utils.security import get_current_user

router = APIRouter(prefix="/recruitment", tags=["Employees & Dashboard"])


def require_ceo(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "ceo":
        raise HTTPException(status_code=403, detail="Sirf CEO yeh kaam kar sakta hai")
    return current_user


# ──── Employees list for interviews ────
@router.get("/employees")
def get_employees_for_interview(db: Session = Depends(get_db), current_user: dict = Depends(require_ceo)):
    company_id = current_user.get("company_id")
    employees = db.query(User).filter(
        User.company_id == company_id,
        User.role == "employee",
        User.status == "active"
    ).all() if company_id else []

    return {
        "employees": [
            {
                "id": emp.id,
                "full_name": emp.full_name,
                "email": emp.email,
                "department": emp.department
            }
            for emp in employees
        ]
    }


# ──── All Employees (Active + Hired) ────
@router.get("/all-employees")
def get_all_employees(db: Session = Depends(get_db), current_user: dict = Depends(require_ceo)):
    company_id = current_user.get("company_id")

    # 1. Manually created employees
    created_users = db.query(User).filter(
        User.company_id == company_id,
        User.role == "employee",
        User.status == "active"
    ).all() if company_id else []

    # 2. Hired Candidates
    jobs = db.query(Job).filter(Job.company_id == company_id).all() if company_id else []
    job_ids = [j.id for j in jobs]

    hired_apps = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "hired"
    ).all() if job_ids else []

    employees = []
    for user in created_users:
        employees.append({
            "employee_id": f"user_{user.id}",
            "full_name": user.full_name,
            "email": user.email,
            "department": user.department or "Engineering",
            "job_title": "Employee",
            "source": "manual",
            "joined_at": str(user.joining_date) if user.joining_date else "—"
        })

    for app in hired_apps:
        candidate = db.query(Candidate).filter(Candidate.id == app.candidate_id).first()
        job = db.query(Job).filter(Job.id == app.job_id).first()
        if candidate and job:
            employees.append({
                "employee_id": f"app_{app.id}",
                "full_name": candidate.full_name,
                "email": candidate.email,
                "department": job.department or "Engineering",
                "job_title": job.title,
                "source": "hired_candidate",
                "joined_at": str(app.updated_at.date()) if app.updated_at else "—"
            })

    return {"total": len(employees), "employees": employees}


# ──── Fire Employee ────
@router.put("/fire-employee/{employee_id}")
def fire_employee(employee_id: str, db: Session = Depends(get_db), current_user: dict = Depends(require_ceo)):
    if employee_id.startswith("app_") or employee_id.startswith("req_"):
        app_id = int(employee_id.replace("app_", "").replace("req_", ""))
        app = db.query(Application).filter(Application.id == app_id).first()
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

        app.disposition = "rejected"
        app.updated_by = current_user["user_id"]
        db.commit()
        return {"message": "Hired employee fired successfully!"}

    elif employee_id.startswith("user_"):
        user_id = int(employee_id.replace("user_", ""))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        user.status = "fired"
        user.updated_by = current_user["user_id"]
        db.commit()
        return {"message": "Created employee fired successfully!"}

    else:
        raise HTTPException(status_code=400, detail="Invalid employee ID format")


# ──── Dashboard Stats ────
@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: dict = Depends(require_ceo)):
    company_id = current_user.get("company_id")
    jobs = db.query(Job).filter(Job.company_id == company_id).all() if company_id else []
    job_ids = [j.id for j in jobs]

    total_jobs = len(jobs)

    total_applied = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "applied"
    ).count() if job_ids else 0

    total_screening = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "screening"
    ).count() if job_ids else 0

    total_interviews = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "interview"
    ).count() if job_ids else 0

    total_offer = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status.in_(["offer_approval", "offer_sent"])
    ).count() if job_ids else 0

    total_hired = db.query(Application).filter(
        Application.job_id.in_(job_ids),
        Application.current_status == "hired"
    ).count() if job_ids else 0

    dept_list = list(set([j.department for j in jobs if j.department]))

    return {
        "total_employees": total_hired,
        "total_departments": len(dept_list),
        "active_openings": total_jobs,
        "pipeline": {
            "applied": total_applied,
            "screening": total_screening,
            "interviews": total_interviews,
            "offer": total_offer,
            "hired": total_hired
        }
    }
