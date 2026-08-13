import json
from datetime import date, time, datetime, timedelta
from app.models.application import Application, ApplicationScreening
from app.models.interview import InterviewSlot

def seed_applications_and_slots(db, users_context, jobs):
    print("🔹 [Level 3] Generating Candidate Applications Across ALL Stages & Interview Slots...")
    ceo_user = users_context["ceo"]
    candidates = users_context["candidates"]
    job_fs = jobs[0]  # Senior Full Stack Engineer (Job 1)
    job_ai = jobs[1]  # AI / ML Engineer (Job 2)

    # 1. Complete Mappings for ALL 7 PIPELINE STAGES for BOTH Jobs
    # Candidates 0-6 -> Job 1 (Apps 1..7)
    # Candidates 7-13 -> Job 2 (Apps 8..14)
    app_mappings = [
        # Job 1 Applications
        (candidates[0], job_fs, "applied", "active", 82.0, 80.0, 85, 80, 90, 75, 85),
        (candidates[1], job_fs, "screening", "active", 89.0, 86.5, 90, 90, 85, 88, 90),
        (candidates[2], job_fs, "interview", "active", 94.5, 92.5, 95, 95, 90, 93, 95),
        (candidates[3], job_fs, "offer_approval", "active", 96.0, 95.0, 98, 95, 95, 95, 98),
        (candidates[4], job_fs, "offer_sent", "active", 91.0, 93.0, 92, 90, 90, 92, 92),
        (candidates[5], job_fs, "hired", "active", 98.0, 97.5, 99, 98, 95, 98, 99),
        (candidates[6], job_fs, "rejected", "rejected", 45.0, 42.0, 40, 45, 60, 45, 80),

        # Job 2 Applications
        (candidates[7], job_ai, "applied", "active", 80.0, 78.0, 82, 78, 88, 72, 82),
        (candidates[8], job_ai, "screening", "active", 87.0, 85.0, 88, 86, 82, 85, 88),
        (candidates[9], job_ai, "interview", "active", 93.0, 91.0, 94, 93, 88, 91, 93),
        (candidates[10], job_ai, "offer_approval", "active", 95.0, 94.0, 96, 94, 93, 94, 96),
        (candidates[11], job_ai, "offer_sent", "active", 90.0, 92.0, 91, 89, 88, 90, 91),
        (candidates[12], job_ai, "hired", "active", 97.0, 96.5, 98, 97, 94, 97, 98),
        (candidates[13], job_ai, "rejected", "rejected", 42.0, 40.0, 38, 42, 58, 42, 78),
    ]

    default_weights = json.dumps({
        "skills_match": 0.35,
        "experience_match": 0.35,
        "education_match": 0.15,
        "keyword_coverage": 0.15
    })

    applications = []
    for idx, (cand, job, curr_status, disp, score, final_s, sm, em, ed, kw, conf) in enumerate(app_mappings):
        received_at_dt = datetime.utcnow() - timedelta(days=idx + 1)
        app = Application(
            candidate_id=cand.id,
            job_id=job.id,
            current_status=curr_status,
            disposition=disp,
            match_score=score,
            final_score=final_s,
            received_at=received_at_dt,
            created_by=ceo_user.id
        )
        db.add(app)
        db.commit()
        db.refresh(app)

        evidence_data = {
            "skills_match": {
                "matched": [
                    {"requirement": f"{job.title} Technical Requirements", "resume_evidence": f"Demonstrated expertise matching {sm}% criteria"}
                ],
                "missing": ["Secondary cloud platform certification"] if sm < 90 else []
            },
            "experience_match": {
                "matched": [
                    {"requirement": "Seniority and Domain Experience", "resume_evidence": f"{em}% alignment with required years of experience"}
                ],
                "missing": ["Legacy enterprise framework exposure"] if em < 90 else []
            },
            "education_match": {
                "matched": [
                    {"requirement": "Degree / Qualification", "resume_evidence": f"Degree aligned with {job.title} expectations"}
                ],
                "missing": []
            },
            "keyword_coverage": {
                "matched": [
                    {"requirement": "Core Role Keywords", "resume_evidence": f"{kw}% direct or inferred keyword match"}
                ],
                "missing": []
            }
        }

        mock_fit_flags = []
        if em > 95:
            mock_fit_flags.append({"flag": "overqualified", "rationale": "Candidate experience significantly exceeds baseline requirements."})
        elif em < 50:
            mock_fit_flags.append({"flag": "underqualified", "rationale": "Experience background is below required threshold."})

        screening = ApplicationScreening(
            application_id=app.id,
            skills_match=sm,
            experience_match=em,
            education_match=ed,
            keyword_coverage=kw,
            match_score=score,
            confidence=conf,
            data_quality_flag=None,
            evidence=json.dumps(evidence_data),
            fit_flags=json.dumps(mock_fit_flags),
            weights_used=default_weights,
            model_used="llama-3.1-8b-instant",
            prompt_version="v2.0"
        )
        db.add(screening)
        db.commit()

        applications.append(app)

    # 2. Availability Slots
    dt_slot1_start = datetime.combine(date.today() + timedelta(days=1), time(10, 0))
    dt_slot1_end = datetime.combine(date.today() + timedelta(days=1), time(11, 0))
    slot1 = InterviewSlot(
        interviewer_id=users_context["interviewer"].id,
        job_id=job_fs.id,
        schedule_start=dt_slot1_start,
        schedule_end=dt_slot1_end,
        is_booked=True,
        created_by=ceo_user.id
    )
    db.add(slot1)

    dt_slot2_start = datetime.combine(date.today() + timedelta(days=2), time(14, 0))
    slot2 = InterviewSlot(
        interviewer_id=users_context["hm"].id,
        job_id=job_ai.id,
        schedule_start=dt_slot2_start,
        schedule_end=dt_slot2_start + timedelta(hours=1),
        is_booked=False,
        created_by=ceo_user.id
    )
    db.add(slot2)

    db.commit()
    return applications
