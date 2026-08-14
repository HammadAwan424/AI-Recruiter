from datetime import date, time, datetime, timedelta
from app.models.application import Application, ApplicationScreening
from app.models.interview import InterviewSlot


def _build_mock_parsed_profile(cand_name: str, job_title: str, skills_str: str) -> dict:
    skills_list = [s.strip() for s in skills_str.split(",")]
    return {
        "schema_version": "extraction.parsed_resume_profile.v1",
        "source_name": f"{cand_name.lower().replace(' ', '_')}_resume.pdf",
        "profile": {
            "skills": skills_list,
            "work_history": [
                {
                    "title": f"Senior {job_title.split()[0]} Developer",
                    "company": "NextGen Systems Corp.",
                    "start_date": "2021-03",
                    "end_date": "Present",
                    "duration": "3+ years",
                    "key_responsibilities": [
                        "Architected scalable microservices and RESTful API endpoints",
                        "Led cross-functional engineering pods and mentored junior engineers",
                        "Streamlined CI/CD deployment pipelines reducing release friction",
                    ],
                },
                {
                    "title": "Software Development Engineer",
                    "company": "Apex Cloud Technologies",
                    "start_date": "2018-07",
                    "end_date": "2021-02",
                    "duration": "2.5 years",
                    "key_responsibilities": [
                        "Engineered full-stack features and optimized SQL database queries",
                        "Implemented comprehensive automated unit and integration test suites",
                    ],
                },
            ],
            "education": [
                {
                    "degree": "B.S. in Computer Science & Engineering",
                    "institution": "University of Washington",
                    "year": "2018",
                }
            ],
            "certifications": [
                "AWS Certified Solutions Architect – Associate",
                "Certified Kubernetes Application Developer (CKAD)",
            ],
            "needs_review": False,
            "review_reason": None,
        },
    }


def seed_applications_and_slots(db, users_context, jobs):
    print("🔹 [Level 3] Generating Candidate Applications Across ALL Stages & Interview Slots (Batched)...")
    ceo_user = users_context["ceo"]
    candidates = users_context["candidates"]
    gmail_account = users_context.get("gmail_account")
    job_fs = jobs[0]  # Senior Full Stack Engineer (Job 1)
    job_ai = jobs[1]  # AI / ML Engineer (Job 2)

    app_mappings = [
        # Job 1 Applications
        (candidates[0], job_fs, "applied", "active", 82.0, 80.0, 85, 80, 90, 75, 85),
        (candidates[1], job_fs, "interview", "active", 89.0, 86.5, 90, 90, 85, 88, 90),
        (candidates[2], job_fs, "interview", "active", 94.5, 92.5, 95, 95, 90, 93, 95),
        (candidates[3], job_fs, "offer_approval", "active", 96.0, 95.0, 98, 95, 95, 95, 98),
        (candidates[4], job_fs, "offer_sent", "active", 91.0, 93.0, 92, 90, 90, 92, 92),
        (candidates[5], job_fs, "hired", "active", 98.0, 97.5, 99, 98, 95, 98, 99),
        (candidates[6], job_fs, "applied", "rejected", 45.0, 42.0, 40, 45, 60, 45, 80),

        # Job 2 Applications
        (candidates[7], job_ai, "applied", "active", 80.0, 78.0, 82, 78, 88, 72, 82),
        (candidates[8], job_ai, "screening", "active", 87.0, 85.0, 88, 86, 82, 85, 88),
        (candidates[9], job_ai, "interview", "active", 93.0, 91.0, 94, 93, 88, 91, 93),
        (candidates[10], job_ai, "offer_approval", "active", 95.0, 94.0, 96, 94, 93, 94, 96),
        (candidates[11], job_ai, "offer_sent", "active", 90.0, 92.0, 91, 89, 88, 90, 91),
        (candidates[12], job_ai, "hired", "active", 97.0, 96.5, 98, 97, 94, 97, 98),
        (candidates[13], job_ai, "applied", "rejected", 42.0, 40.0, 38, 42, 58, 42, 78),
    ]

    default_weights = {
        "skills_match": 0.35,
        "experience_match": 0.35,
        "education_match": 0.15,
        "keyword_coverage": 0.15,
    }

    applications = []
    screenings_to_create = []

    for idx, (cand, job, curr_status, disp, score, final_s, sm, em, ed, kw, conf) in enumerate(app_mappings):
        received_at_dt = datetime.utcnow() - timedelta(days=idx + 1)
        mock_profile = _build_mock_parsed_profile(cand.full_name, job.title, job.skills)
        cv_text = (
            f"RESUME OF {cand.full_name.upper()}\n"
            f"Email: {cand.email} | Phone: {cand.phone}\n\n"
            f"PROFESSIONAL SUMMARY:\n"
            f"Results-oriented engineer with extensive experience in {job.skills}. "
            f"Track record of shipping production-grade scalable systems.\n\n"
            f"TECHNICAL SKILLS:\n{job.skills}\n\n"
            f"WORK EXPERIENCE:\n"
            f"NextGen Systems Corp. — Senior {job.title.split()[0]} Developer (2021-Present)\n"
            f"- Architected scalable cloud infrastructure and low-latency REST APIs.\n\n"
            f"EDUCATION:\n"
            f"B.S. in Computer Science, University of Washington (2018)"
        )

        app = Application(
            candidate_id=cand.id,
            job_id=job.id,
            current_status=curr_status,
            disposition=disp,
            match_score=score,
            final_score=final_s,
            parsed_profile=mock_profile,
            cv_text=cv_text,
            cv_pdf_path=f"/uploads/cvs/{cand.full_name.lower().replace(' ', '_')}_resume.pdf",
            gmail_account_id=gmail_account.id if gmail_account and idx % 2 == 0 else None,
            gmail_message_id=f"mock_msg_{idx+1:03d}" if gmail_account and idx % 2 == 0 else None,
            received_at=received_at_dt,
            created_by=ceo_user.id,
        )
        applications.append(app)

        evidence_data = {
            "skills_match": {
                "matched": [
                    {
                        "requirement": f"{job.title} Technical Core Requirements",
                        "resume_evidence": f"Demonstrated expertise matching {sm}% key skills: {job.skills[:40]}...",
                    }
                ],
                "missing": ["Secondary cloud platform certification"] if sm < 90 else [],
            },
            "experience_match": {
                "matched": [
                    {
                        "requirement": "Seniority and Domain Experience Requirements",
                        "resume_evidence": f"{em}% alignment with required years of experience at NextGen Systems",
                    }
                ],
                "missing": ["Legacy enterprise framework exposure"] if em < 90 else [],
            },
            "education_match": {
                "matched": [
                    {
                        "requirement": "Degree / Qualification Alignment",
                        "resume_evidence": "B.S. in Computer Science & Engineering, University of Washington (2018)",
                    }
                ],
                "missing": [],
            },
            "keyword_coverage": {
                "matched": [
                    {
                        "requirement": "Core Role Keywords Coverage",
                        "resume_evidence": f"{kw}% direct keyword alignment found in technical summary",
                    }
                ],
                "missing": [],
            },
        }

        mock_fit_flags = []
        if em >= 95:
            mock_fit_flags.append({
                "flag": "overqualified",
                "rationale": "Candidate experience and seniority significantly exceed baseline role level.",
            })
        elif em < 50:
            mock_fit_flags.append({
                "flag": "underqualified",
                "rationale": "Experience background is below required threshold for this requisition.",
            })

        screenings_to_create.append({
            "skills_match": sm,
            "experience_match": em,
            "education_match": ed,
            "keyword_coverage": kw,
            "match_score": score,
            "confidence": conf,
            "data_quality_flag": None,
            "evidence": evidence_data,
            "fit_flags": mock_fit_flags,
            "weights_used": default_weights,
            "model_used": "llama-3.1-8b-instant",
            "prompt_version": "v2.0",
        })

    # Bulk insert applications first to assign database IDs
    db.add_all(applications)
    db.flush()

    # Bulk insert matching application screenings
    screenings = [
        ApplicationScreening(application_id=app.id, **data)
        for app, data in zip(applications, screenings_to_create)
    ]
    db.add_all(screenings)

    # Availability Slots for Interview Scheduling
    dt_slot1_start = datetime.combine(date.today() + timedelta(days=1), time(10, 0))
    dt_slot1_end = datetime.combine(date.today() + timedelta(days=1), time(11, 0))
    slot1 = InterviewSlot(
        interviewer_id=users_context["interviewer"].id,
        job_id=job_fs.id,
        schedule_start=dt_slot1_start,
        schedule_end=dt_slot1_end,
        is_booked=True,
        created_by=ceo_user.id,
    )

    dt_slot2_start = datetime.combine(date.today() + timedelta(days=2), time(14, 0))
    slot2 = InterviewSlot(
        interviewer_id=users_context["hm"].id,
        job_id=job_ai.id,
        schedule_start=dt_slot2_start,
        schedule_end=dt_slot2_start + timedelta(hours=1),
        is_booked=False,
        created_by=ceo_user.id,
    )

    dt_slot3_start = datetime.combine(date.today() + timedelta(days=1), time(15, 0))
    slot3 = InterviewSlot(
        interviewer_id=users_context["interviewer"].id,
        job_id=job_fs.id,
        schedule_start=dt_slot3_start,
        schedule_end=dt_slot3_start + timedelta(hours=1),
        is_booked=False,
        created_by=ceo_user.id,
    )

    dt_slot4_start = datetime.combine(date.today() + timedelta(days=3), time(11, 0))
    slot4 = InterviewSlot(
        interviewer_id=users_context["interviewer"].id,
        job_id=None,  # Universal scope
        schedule_start=dt_slot4_start,
        schedule_end=dt_slot4_start + timedelta(hours=1),
        is_booked=False,
        created_by=ceo_user.id,
    )

    db.add_all([slot1, slot2, slot3, slot4])
    db.commit()

    print(
        f"  ✓ Level 3 Complete: {len(applications)} Applications & Screenings seeded, "
        f"4 Interview Slots created in 1 transaction."
    )
    return applications
