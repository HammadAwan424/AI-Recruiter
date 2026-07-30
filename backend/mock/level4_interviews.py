from datetime import date, time, timedelta
from app.models.interview import InterviewModel

def seed_interviews(db, applications, ceo_user, hr_user):
    print("🔹 [Level 4] Generating Scheduled Interviews...")

    app1 = applications[0]

    interview1 = db.query(InterviewModel).filter(InterviewModel.application_id == app1.id).first()
    if not interview1:
        interview1 = InterviewModel(
            application_id=app1.id,
            scheduled_date=date.today() + timedelta(days=1),
            scheduled_time=time(10, 0),
            duration_minutes=45,
            meeting_type="GOOGLE_MEET",
            meeting_link="https://meet.jit.si/Agentra-MOCK1001",
            interviewer_1_id=ceo_user.id,
            interviewer_2_id=hr_user.id,
            status="SCHEDULED",
            created_by=ceo_user.id
        )
        db.add(interview1)
        db.commit()
        db.refresh(interview1)

    print(f"  ✓ Level 4 Complete: 1 Scheduled Interview created for Application ID: {app1.id}.")
    return [interview1]
