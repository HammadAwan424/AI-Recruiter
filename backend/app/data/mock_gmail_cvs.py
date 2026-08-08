"""
Mock candidate CV data file containing elaborate, realistic professional resume texts
simulating Gmail attachment extractions for development and testing.
"""

MOCK_GMAIL_CANDIDATE_APPLICATIONS = [
    {
        "gmail_message_id": "mock_msg_001",
        "message_id": "mock_msg_001",
        "email": "alex.johnson@example.com",
        "full_name": "Alex Johnson",
        "name": "Alex Johnson",
        "phone": "+1 (555) 234-5678",
        "subject": "Application for Senior Full Stack Engineer",
        "cv_text": """ALEX JOHNSON
Email: alex.johnson@example.com | Phone: +1 (555) 234-5678 | San Francisco, CA
LinkedIn: linkedin.com/in/alexjohnson-tech | GitHub: github.com/alexj-dev

PROFESSIONAL SUMMARY
Results-driven Senior Software Engineer with over 6 years of experience architecting, building, and deploying high-availability cloud applications and microservices. Demonstrated expertise in Python (FastAPI, Django), TypeScript (React, Next.js), PostgreSQL, Docker, Kubernetes, and AWS infrastructure. Track record of optimizing database queries, implementing secure JWT/OAuth authentication workflows, and leading cross-functional engineering teams in fast-paced Agile environments.

CORE COMPETENCIES & TECHNICAL SKILLS
- Programming Languages: Python, TypeScript, JavaScript, SQL, HTML5/CSS3
- Frameworks & Libraries: FastAPI, Django, React.js, Next.js, Redux Toolkit, TailwindCSS, Node.js
- Databases & Caching: PostgreSQL, Redis, MongoDB, SQLAlchemy ORM
- DevOps & Cloud: AWS (EC2, S3, RDS, Lambda), Docker, Kubernetes, CI/CD (GitHub Actions), Nginx
- Architecture & Practices: RESTful APIs, Microservices, RAG/LLM System Integration, System Design, Unit/Integration Testing (Pytest, Jest)

PROFESSIONAL EXPERIENCE

Senior Full Stack Developer | TechCorp Systems, San Francisco, CA
March 2022 – Present
- Architected and maintained a high-throughput microservices backend using FastAPI and PostgreSQL, serving over 500,000 active monthly users with 99.98% uptime.
- Led the redesign of the core web dashboard utilizing React, TypeScript, and TailwindCSS, reducing load times by 42% and improving user engagement metrics by 28%.
- Integrated AI-driven document processing pipelines leveraging LLMs and vector search embeddings for automated metadata extraction.
- Engineered automated CI/CD deployment pipelines with GitHub Actions and Docker containerization on AWS EKS.

Software Engineer | CloudScale Innovations, Austin, TX
July 2018 – February 2022
- Developed RESTful API endpoints and background processing queues using Python, Celery, and Redis.
- Optimized complex PostgreSQL database schemas, indexing strategies, and query performance, reducing peak query latency from 850ms to 95ms.
- Built reusable modular UI component libraries with React and Redux, ensuring accessibility (WCAG 2.1 compliance) and design consistency across product verticals.
- Partnered with product managers and security auditors to implement SOC 2 compliant OAuth2 authentication flows.

EDUCATION & CERTIFICATIONS
- Bachelor of Science (B.S.) in Computer Science | University of California, Berkeley (2014 – 2018)
- AWS Certified Solutions Architect – Associate (2021)
- Certified Kubernetes Application Developer (CKAD) (2023)""",
        "cv_pdf": None,
        "cv_pdf_path": None,
        "cv_filename": "alex_johnson_resume.pdf"
    },
    {
        "gmail_message_id": "mock_msg_002",
        "message_id": "mock_msg_002",
        "email": "sarah.smith@example.com",
        "full_name": "Sarah Smith",
        "name": "Sarah Smith",
        "phone": "+1 (555) 876-5432",
        "subject": "Application for Lead Frontend Engineer",
        "cv_text": """SARAH SMITH
Email: sarah.smith@example.com | Phone: +1 (555) 876-5432 | Seattle, WA
Portfolio: sarahsmith.dev | GitHub: github.com/sarahsmith-frontend

PROFESSIONAL SUMMARY
Innovative Lead Frontend & Platform Engineer with 5+ years of experience designing and scaling modern enterprise web applications. Specialized in TypeScript, React, Next.js, GraphQL, State Management, and Design Systems. Passionate about web performance optimization, modern CSS architecture, micro-frontends, and automated testing. Adept at bridging product requirements with scalable technical architecture.

CORE COMPETENCIES & TECHNICAL SKILLS
- Frontend Architecture: TypeScript, React, Next.js, Redux, Zustand, HTML5, Vanilla CSS, TailwindCSS, Webpack, Vite
- API Design & State: GraphQL (Apollo Client), REST APIs, RTK Query, Axios, WebSockets
- Backend & Cloud Integration: Node.js, Express, PostgreSQL, Docker, AWS S3, Vercel
- Testing & Tooling: Jest, React Testing Library, Cypress, ESLint, Git, Agile/Scrum

PROFESSIONAL EXPERIENCE

Lead Frontend Engineer | CloudScale Tech, Seattle, WA
January 2022 – Present
- Directed frontend architecture for enterprise SaaS recruitment platform built with React 18, TypeScript, and Next.js.
- Designed and established a centralized UI Design System and component library, accelerating new feature delivery across 4 product teams by 35%.
- Implemented real-time updates using WebSockets and optimistic UI state updates for live candidate tracking boards.
- Optimized web vitals performance (LCP, CLS, FID), improving Lighthouse performance scores from 64 to 98.

Full Stack Engineer | Apex Data Labs, Seattle, WA
June 2019 – December 2021
- Developed responsive web applications using React, Node.js, GraphQL, and PostgreSQL.
- Authored comprehensive end-to-end integration test suites with Cypress and Jest, maintaining 92% code coverage.
- Managed cloud deployment pipelines on AWS with Docker containerization and Nginx reverse proxies.

EDUCATION & CERTIFICATIONS
- Bachelor of Science (B.S.) in Software Engineering | University of Washington (2015 – 2019)
- Meta Certified Front-End Developer (2022)""",
        "cv_pdf": None,
        "cv_pdf_path": None,
        "cv_filename": "sarah_smith_cv.pdf"
    }
]
