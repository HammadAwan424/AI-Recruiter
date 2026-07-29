from datetime import date, time, timedelta
from app.models.interview import InterviewModel

def seed_interviews(db, applications, ceo_user, hr_user):
    print("🔹 [Level 4] Generating Scheduled Interviews...")

    # Target application 0 (Alex Johnson for Full Stack Engineer)
    app1 = applications[0]

    interview1 = db.query(InterviewModel).filter(InterviewModel.application_id == app1.id).first()
    if not interview1:
        interview1 = InterviewModel(
            application_id=app1.id,         # Read directly from application object
            candidate_id=app1.candidate_id, # Read directly from application object
            job_id=app1.job_id,             # Read directly from application object
            scheduled_date=date.today() + timedelta(days=1),
            scheduled_time=time(10, 0),
            duration_minutes=45,
            meeting_type="GOOGLE_MEET",
            meeting_link="https://meet.jit.si/Agentra-MOCK1001",
            interviewer_1=ceo_user.full_name,  # Read directly from named parameter
            interviewer_2=hr_user.full_name,   # Read directly from named parameter
            status="SCHEDULED"
        )
        db.add(interview1)
        db.commit()
        db.refresh(interview1)

    print(f"  ✓ Level 4 Complete: 1 Scheduled Interview created for Application ID: {app1.id}.")
    return [interview1]
