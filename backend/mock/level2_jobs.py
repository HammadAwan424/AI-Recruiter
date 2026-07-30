from app.models.job import Job

def seed_jobs(db, ceo_user):
    print("🔹 [Level 2] Generating Job Postings...")

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
                company_id=ceo_user.company_id,  # Read directly from named parameter
                title=item["title"],
                department=item["department"],
                employment_type=item["employment_type"],
                experience=item["experience"],
                skills=item["skills"],
                salary_range=item["salary_range"],
                full_description=item["full_description"],
                keywords=item["keywords"],
                status="published"
            )
            db.add(job)
            db.commit()
            db.refresh(job)
        jobs.append(job)

    print(f"  ✓ Level 2 Complete: {len(jobs)} Jobs created (Linked to Company ID: {ceo_user.company_id}).")
    return jobs
