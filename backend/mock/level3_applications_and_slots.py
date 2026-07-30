from datetime import date, time, timedelta
from app.models.application import Application
from app.models.interview import InterviewSlot

def seed_applications_and_slots(db, candidates, jobs, ceo_user):
    print("🔹 [Level 3] Generating Candidate Applications & Interview Slots...")

    job_fs = jobs[0]  # Senior Full Stack Engineer
    job_ai = jobs[1]  # AI / ML Engineer

    # 1. Applications & Scores Definition
    app_mappings = [
        (candidates[0], job_fs, "interview", "active", 94.5, "GraphQL", "Strong fullstack fit.", 92.5),
        (candidates[1], job_ai, "offer_sent", "active", 91.0, "Kubernetes", "Excellent ML experience.", 94.6),
        (candidates[2], job_fs, "screening", "active", 88.0, "Python Backend", "Good backend engineer.", 85.3),
        (candidates[3], job_ai, "offer_approval", "active", 96.0, "None", "Top AI candidate.", 94.0)
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
            interviewer_id=ceo_user.id,
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
            interviewer_id=ceo_user.id,
            job_id=job_ai.id,
            slot_date=date.today() + timedelta(days=2),
            start_time=time(14, 0),
            end_time=time(15, 0),
            is_booked=False,
            created_by=ceo_user.id
        )
        db.add(slot2)

    db.commit()

    print(f"  ✓ Level 3 Complete: {len(applications)} Applications & 2 Interview Slots created.")
    return applications
