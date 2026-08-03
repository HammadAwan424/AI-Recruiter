from app.models.job import Job
from app.models.rbac import UserJobScope

def seed_jobs(db, users_context):
    print("🔹 [Level 2] Generating Job Postings & Assigning UserJobScopes...")
    ceo_user = users_context["ceo"]
    recruiter = users_context["recruiter"]
    hm = users_context["hm"]
    interviewer = users_context["interviewer"]

    jobs_def = [
        {
            "title": "Senior Full Stack Engineer",
            "department": "Engineering",
            "employment_type": "Full-Time",
            "experience": "5+ Years",
            "skills": "React, Node.js, Python, PostgreSQL, TypeScript",
            "salary_range": "$120,000 - $150,000",
            "full_description": "Leading full stack architecture across React frontend and FastAPI backend.",
            "keywords": "React, FastAPI, PostgreSQL"
        },
        {
            "title": "AI / ML Engineer",
            "department": "Artificial Intelligence",
            "employment_type": "Full-Time",
            "experience": "3+ Years",
            "skills": "PyTorch, LangChain, Transformers, Python, RAG",
            "salary_range": "$130,000 - $160,000",
            "full_description": "Building cutting-edge AI recruiter agentic workflows and LLM pipelines.",
            "keywords": "PyTorch, LLM, LangChain"
        }
    ]

    jobs = []
    for item in jobs_def:
        job = db.query(Job).filter(Job.title == item["title"]).first()
        if not job:
            job = Job(
                company_id=ceo_user.company_id,
                title=item["title"],
                department=item["department"],
                employment_type=item["employment_type"],
                experience=item["experience"],
                skills=item["skills"],
                salary_range=item["salary_range"],
                full_description=item["full_description"],
                keywords=item["keywords"],
                status="published",
                created_by=ceo_user.id
            )
            db.add(job)
            db.commit()
            db.refresh(job)
        jobs.append(job)

        # Seed UserJobScopes for recruiter, hiring manager, and interviewer
        for scoped_user in (recruiter, hm, interviewer):
            existing_scope = db.query(UserJobScope).filter_by(
                user_id=scoped_user.id,
                job_id=job.id
            ).first()
            if not existing_scope:
                db.add(UserJobScope(
                    user_id=scoped_user.id,
                    job_id=job.id,
                    created_by=ceo_user.id
                ))
        db.commit()

    print(f"  ✓ Level 2 Complete: {len(jobs)} Jobs created & UserJobScopes assigned.")
    return jobs
