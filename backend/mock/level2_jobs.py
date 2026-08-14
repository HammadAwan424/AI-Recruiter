from datetime import datetime, timedelta
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
            "skills": "React, TypeScript, Python, FastAPI, PostgreSQL, Docker, AWS",
            "salary_range": "$120,000 - $150,000",
            "full_description": """Role Overview:
We are seeking a Senior Full Stack Engineer to lead technical architecture across our modern React frontend and FastAPI Python backend. In this high-impact role, you will design scalable web microservices, optimize PostgreSQL data pipelines, and build rich, dynamic user interfaces for our recruitment automation platform.

Key Responsibilities:
- Design, build, and maintain high-performance web applications using React.js, TypeScript, and FastAPI.
- Architect robust RESTful APIs and PostgreSQL database schemas optimized for high concurrency and low latency.
- Collaborate with product management, AI research engineers, and UX designers to deliver state-of-the-art user experiences.
- Implement automated unit and integration testing pipelines (Jest, Pytest) and containerized deployment workflows (Docker, Kubernetes).
- Mentor junior engineers, participate in technical code reviews, and drive engineering best practices.

Required Qualifications & Technical Skills:
- 5+ years of professional software development experience in full stack environments.
- Expert-level proficiency in React, TypeScript, HTML5/CSS3, and modern frontend state management.
- Strong proficiency in Python 3.10+, FastAPI (or Django/Flask), and ORMs (SQLAlchemy).
- Deep experience with relational databases, specifically PostgreSQL (indexing, query tuning, migrations).
- Experience with containerization technologies (Docker, Kubernetes) and CI/CD pipelines (GitHub Actions, AWS).

Preferred Qualifications:
- Bachelor's degree in Computer Science, Software Engineering, or related technical field.
- Familiarity with AI/LLM integration, LangChain, or vector search databases.
- Prior experience working in high-growth SaaS startups or Agile development teams.""",
            "keywords": "React, TypeScript, Python, FastAPI, PostgreSQL, Docker, AWS, REST API, System Design"
        },
        {
            "title": "AI / ML Engineer",
            "department": "Artificial Intelligence",
            "employment_type": "Full-Time",
            "experience": "3+ Years",
            "skills": "Python, PyTorch, LangChain, LangGraph, Transformers, LLMs, RAG",
            "salary_range": "$130,000 - $160,000",
            "full_description": """Role Overview:
We are looking for an AI / ML Engineer to drive the development of our agentic recruitment intelligence workflows. You will design, evaluate, and deploy structured Large Language Model (LLM) pipelines, Retrieval-Augmented Generation (RAG) engines, and machine learning models that evaluate candidate resumes and automate hiring workflows.

Key Responsibilities:
- Build and optimize structured LLM chains using LangChain, LangGraph, and Groq/OpenAI APIs.
- Architect RAG systems and vector database indexing pipelines using ChromaDB and Sentence Transformers.
- Design evaluation frameworks to measure LLM output quality, scoring consistency, and confidence gating.
- Collaborate with backend engineers to integrate AI services into production FastAPI and PostgreSQL infrastructure.
- Monitor model performance, latency, and API costs while maintaining strict fairness and bias exclusion standards.

Required Qualifications & Technical Skills:
- 3+ years of hands-on experience building and deploying machine learning models or LLM applications.
- Strong proficiency in Python, PyTorch/TensorFlow, and ML frameworks.
- Demonstrated experience with LLM frameworks (LangChain, LangGraph, LlamaIndex) and prompt engineering techniques.
- Solid understanding of vector databases (ChromaDB, Pinecone, FAISS) and semantic embedding models.
- Familiarity with REST API integration (FastAPI) and Docker containerization.

Preferred Qualifications:
- Master's or Bachelor's degree in Artificial Intelligence, Computer Science, Data Science, or related field.
- Experience with structured output function calling and tool-use LLM bindings.
- Track record of deploying production AI microservices on cloud infrastructure (AWS/GCP).""",
            "keywords": "Python, PyTorch, LangChain, LangGraph, LLM, RAG, Transformers, Machine Learning, Deep Learning"
        }
    ]

    jobs = []
    for item in jobs_def:
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
            db.add(UserJobScope(
                user_id=scoped_user.id,
                job_id=job.id,
                created_by=ceo_user.id
            ))
        db.commit()

    print(f"  ✓ Level 2 Complete: {len(jobs)} Jobs created & UserJobScopes assigned.")
    return jobs
