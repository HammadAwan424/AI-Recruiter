from datetime import date, time, datetime, timedelta
from app.models.interview import InterviewModel, InterviewFeedback, InterviewInterviewers

def seed_interviews(db, users_context, applications):
    print("🔹 [Level 4] Generating Scheduled Interviews & Feedback Scores...")
    ceo_user = users_context["ceo"]
    hm = users_context["hm"]
    interviewer = users_context["interviewer"]

    interviews_created = []

    # 1. Interview Round for Application #3 (Marcus Vance - Stage: Interview, Status: COMPLETED)
    app_interview = applications[2]
    interview1 = db.query(InterviewModel).filter(InterviewModel.application_id == app_interview.id).first()
    if not interview1:
        start_1 = datetime.combine(date.today() - timedelta(days=2), time(10, 0))
        end_1 = datetime.combine(date.today() - timedelta(days=2), time(10, 45))
        interview1 = InterviewModel(
            application_id=app_interview.id,
            round_number=1,
            round_label="Round 1",
            schedule_start=start_1,
            schedule_end=end_1,
            meeting_type="GOOGLE_MEET",
            meeting_link="https://meet.jit.si/Agentra-MOCK1001",
            status="COMPLETED",
            created_by=ceo_user.id
        )
        db.add(interview1)
        db.flush()

        assignment1 = InterviewInterviewers(interview_id=interview1.id, interviewer_id=interviewer.id)
        assignment2 = InterviewInterviewers(interview_id=interview1.id, interviewer_id=hm.id)
        db.add(assignment1)
        db.add(assignment2)
        db.flush()

        fb1 = InterviewFeedback(
            interview_interviewer_id=assignment1.id,
            technical_score=9.0,
            communication_score=9.5,
            notes="Strong problem solving, clear architecture explanation.",
            created_by=interviewer.id
        )
        fb2 = InterviewFeedback(
            interview_interviewer_id=assignment2.id,
            technical_score=9.5,
            communication_score=9.0,
            notes="Great culture fit and system design capability.",
            created_by=hm.id
        )
        db.add(fb1)
        db.add(fb2)
        db.commit()
        db.refresh(interview1)
    interviews_created.append(interview1)

    # 2. Historical Interview Round for Offer Approval Candidate (Elena Rostova - index 3)
    app_approval = applications[3]
    interview2 = db.query(InterviewModel).filter(InterviewModel.application_id == app_approval.id).first()
    if not interview2:
        start_2 = datetime.combine(date.today() - timedelta(days=5), time(14, 30))
        end_2 = datetime.combine(date.today() - timedelta(days=5), time(15, 30))
        interview2 = InterviewModel(
            application_id=app_approval.id,
            round_number=1,
            round_label="Round 1",
            schedule_start=start_2,
            schedule_end=end_2,
            meeting_type="GOOGLE_MEET",
            meeting_link="https://meet.jit.si/Agentra-MOCK1002",
            status="COMPLETED",
            created_by=ceo_user.id
        )
        db.add(interview2)
        db.flush()

        assignment3 = InterviewInterviewers(interview_id=interview2.id, interviewer_id=interviewer.id)
        db.add(assignment3)
        db.flush()

        fb3 = InterviewFeedback(
            interview_interviewer_id=assignment3.id,
            technical_score=9.8,
            communication_score=9.6,
            notes="Exceptional deep learning expertise & LLM pipeline design.",
            created_by=interviewer.id
        )
        db.add(fb3)
        db.commit()
        db.refresh(interview2)
    interviews_created.append(interview2)

    # 3. Historical Interview Round for Hired Candidate (Olivia Taylor - index 5)
    app_hired = applications[5]
    interview3 = db.query(InterviewModel).filter(InterviewModel.application_id == app_hired.id).first()
    if not interview3:
        start_3 = datetime.combine(date.today() - timedelta(days=10), time(11, 0))
        end_3 = datetime.combine(date.today() - timedelta(days=10), time(11, 45))
        interview3 = InterviewModel(
            application_id=app_hired.id,
            round_number=1,
            round_label="Round 1",
            schedule_start=start_3,
            schedule_end=end_3,
            meeting_type="GOOGLE_MEET",
            meeting_link="https://meet.jit.si/Agentra-MOCK1003",
            status="COMPLETED",
            created_by=ceo_user.id
        )
        db.add(interview3)
        db.flush()

        assignment4 = InterviewInterviewers(interview_id=interview3.id, interviewer_id=hm.id)
        db.add(assignment4)
        db.flush()

        fb4 = InterviewFeedback(
            interview_interviewer_id=assignment4.id,
            technical_score=9.9,
            communication_score=9.8,
            notes="Unanimous hire recommendation from leadership team.",
            created_by=hm.id
        )
        db.add(fb4)
        db.commit()
        db.refresh(interview3)
    interviews_created.append(interview3)

    print(f"  ✓ Level 4 Complete: {len(interviews_created)} Completed Interviews created with multi-interviewer feedback scorecards.")
    return interviews_created
