from datetime import date, time, timedelta
from app.models.recruitment import Application, FinalScore
from app.models.interview import InterviewSlot

def seed_applications_and_slots(db, candidates, jobs, ceo_user):
    print("🔹 [Level 3] Generating Candidate Applications, Final Scores & Interview Slots...")

    job_fs = jobs[0]  # Senior Full Stack Engineer
    job_ai = jobs[1]  # AI / ML Engineer

    # 1. Applications & Scores Definition
    app_mappings = [
        (candidates[0], job_fs, "interview_scheduled", 94.5, "GraphQL", 92.0, 90.0, 92.5, "Strong Hire"),
        (candidates[1], job_ai, "offer_sent", 91.0, "Kubernetes", 98.0, 95.0, 94.6, "Strong Hire"),
        (candidates[2], job_fs, "shortlisted", 83.0, "Python Backend", 85.0, 88.0, 85.3, "Hire"),
        (candidates[3], job_ai, "interview_completed", 96.0, "None", 94.0, 92.0, 94.0, "Strong Hire")
    ]

    applications = []
    for cand, job, status, score, gap, tech_s, comm_s, final_s, cat in app_mappings:
        app = db.query(Application).filter(
            Application.candidate_id == cand.id,
            Application.job_id == job.id
        ).first()

        if not app:
            app = Application(
                candidate_id=cand.id,  # Read directly from named parameter
                job_id=job.id,          # Read directly from named parameter
                status=status,
                match_score=score,
                skill_gap=gap,
                summary=f"Automated evaluation for {cand.full_name} applying to {job.title}."
            )
            db.add(app)
            db.commit()
            db.refresh(app)

        # Seed FinalScore for ranked-candidates route
        fs = db.query(FinalScore).filter(
            FinalScore.candidate_id == cand.id,
            FinalScore.job_id == job.id
        ).first()

        if not fs:
            fs = FinalScore(
                candidate_id=cand.id,
                job_id=job.id,
                resume_score=score,
                technical_score=tech_s,
                communication_score=comm_s,
                final_score=final_s,
                ranking_category=cat
            )
            db.add(fs)
            db.commit()

        applications.append(app)

    # 2. Availability Slots
    slot1 = db.query(InterviewSlot).filter(InterviewSlot.slot_date == date.today() + timedelta(days=1)).first()
    if not slot1:
        slot1 = InterviewSlot(
            interviewer_id=ceo_user.id,  # Read directly from named parameter
            job_id=job_fs.id,
            slot_date=date.today() + timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(11, 0),
            is_booked=True
        )
        db.add(slot1)

    slot2 = db.query(InterviewSlot).filter(InterviewSlot.slot_date == date.today() + timedelta(days=2)).first()
    if not slot2:
        slot2 = InterviewSlot(
            interviewer_id=ceo_user.id,
            job_id=0,  # Sentinel 0 = Any job
            slot_date=date.today() + timedelta(days=2),
            start_time=time(14, 0),
            end_time=time(15, 0),
            is_booked=False
        )
        db.add(slot2)

    db.commit()

    print(f"  ✓ Level 3 Complete: {len(applications)} Applications & FinalScores, 2 Interview Slots created.")
    return applications
