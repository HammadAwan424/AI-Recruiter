from datetime import date, time, datetime, timedelta
from app.models.interview import InterviewModel, InterviewFeedback, InterviewInterviewers


def seed_interviews(db, users_context, applications):
    print("🔹 [Level 4] Generating Scheduled Interviews & Feedback Scores (Batched)...")
    ceo_user = users_context["ceo"]
    hm = users_context["hm"]
    interviewer = users_context["interviewer"]

    # 1. Candidate in 'interview' stage with ACTIVE SELF-SCHEDULE TOKEN (Sophia Chen - App 2)
    app_self_schedule = applications[1]  # Sophia Chen
    interview_self_sched = InterviewModel(
        application_id=app_self_schedule.id,
        round_number=1,
        round_label="Round 1 – Technical Screen",
        meeting_type="GOOGLE_MEET",
        meeting_link="https://meet.jit.si/AIRecruiter-SELF1001",
        self_schedule_token="mock_self_sched_token_001",
        token_expires_at=datetime.utcnow() + timedelta(days=7),
        status="AWAITING_SELECTION",
        created_by=ceo_user.id,
    )

    # 2. Completed Interview Round for Application #3 (Marcus Vance - Stage: Interview, Job 1)
    app_interview = applications[2]
    start_1 = datetime.combine(date.today() - timedelta(days=2), time(10, 0))
    end_1 = datetime.combine(date.today() - timedelta(days=2), time(10, 45))
    interview1 = InterviewModel(
        application_id=app_interview.id,
        round_number=1,
        round_label="Round 1 – Full Stack Architecture",
        schedule_start=start_1,
        schedule_end=end_1,
        meeting_type="GOOGLE_MEET",
        meeting_link="https://meet.jit.si/AIRecruiter-MOCK1001",
        status="COMPLETED",
        created_by=ceo_user.id,
    )

    # 3. Historical Interview Round for Offer Approval Candidate (Elena Rostova - Job 1, App 4)
    app_approval = applications[3]
    start_2 = datetime.combine(date.today() - timedelta(days=5), time(14, 30))
    end_2 = datetime.combine(date.today() - timedelta(days=5), time(15, 30))
    interview2 = InterviewModel(
        application_id=app_approval.id,
        round_number=1,
        round_label="Round 1 – Deep Learning & LLM Systems",
        schedule_start=start_2,
        schedule_end=end_2,
        meeting_type="GOOGLE_MEET",
        meeting_link="https://meet.jit.si/AIRecruiter-MOCK1002",
        status="COMPLETED",
        created_by=ceo_user.id,
    )

    # 4. Historical Interview Round for Hired Candidate (Olivia Taylor - Job 1, App 6)
    app_hired = applications[5]
    start_3 = datetime.combine(date.today() - timedelta(days=10), time(11, 0))
    end_3 = datetime.combine(date.today() - timedelta(days=10), time(11, 45))
    interview3 = InterviewModel(
        application_id=app_hired.id,
        round_number=1,
        round_label="Round 1 – Executive Leadership Interview",
        schedule_start=start_3,
        schedule_end=end_3,
        meeting_type="GOOGLE_MEET",
        meeting_link="https://meet.jit.si/AIRecruiter-MOCK1003",
        status="COMPLETED",
        created_by=ceo_user.id,
    )

    # Bulk insert all 4 interviews to obtain generated IDs
    interviews = [interview_self_sched, interview1, interview2, interview3]
    db.add_all(interviews)
    db.flush()

    # Create all assignments
    assign_self = InterviewInterviewers(
        interview_id=interview_self_sched.id, interviewer_id=interviewer.id
    )
    assignment1 = InterviewInterviewers(
        interview_id=interview1.id, interviewer_id=interviewer.id
    )
    assignment2 = InterviewInterviewers(
        interview_id=interview1.id, interviewer_id=hm.id
    )
    assignment3 = InterviewInterviewers(
        interview_id=interview2.id, interviewer_id=interviewer.id
    )
    assignment4 = InterviewInterviewers(
        interview_id=interview3.id, interviewer_id=hm.id
    )

    assignments = [assign_self, assignment1, assignment2, assignment3, assignment4]
    db.add_all(assignments)
    db.flush()

    # Create feedback scorecards
    fb1 = InterviewFeedback(
        interview_interviewer_id=assignment1.id,
        technical_score=9.0,
        communication_score=9.5,
        notes="Strong problem solving, clear architecture explanation.",
        created_by=interviewer.id,
    )
    fb2 = InterviewFeedback(
        interview_interviewer_id=assignment2.id,
        technical_score=9.5,
        communication_score=9.0,
        notes="Great culture fit and system design capability.",
        created_by=hm.id,
    )
    fb3 = InterviewFeedback(
        interview_interviewer_id=assignment3.id,
        technical_score=9.8,
        communication_score=9.6,
        notes="Exceptional deep learning expertise & LLM pipeline design.",
        created_by=interviewer.id,
    )
    fb4 = InterviewFeedback(
        interview_interviewer_id=assignment4.id,
        technical_score=9.9,
        communication_score=9.8,
        notes="Unanimous hire recommendation from leadership team.",
        created_by=hm.id,
    )

    db.add_all([fb1, fb2, fb3, fb4])
    db.commit()

    print(
        f"  ✓ Level 4 Complete: {len(interviews)} Interviews & {len(assignments)} Assignments created "
        f"in 1 transaction."
    )
    return interviews
