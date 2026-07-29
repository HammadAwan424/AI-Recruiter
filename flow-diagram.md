Here is the complete project documentation split **feature by feature**, with each feature grouped inside its own standalone ```mermaid``` code block for easy copy-pasting into markdown files:

---

### Feature 1: Authentication & User Management (RBAC)

```mermaid
flowchart TD
    CEO_Signup["CEO Registers (/auth/ceo-signup)"] -->|status: PENDING| DB_Users[("users")]
    SuperAdmin["SuperAdmin Dashboard"] -->|"Approve CEO (/admin/approve-ceo)"| DB_Users
    DB_Users -->|status: APPROVED + 30 Days Trial| CEO_Login["CEO Login (/auth/login)"]
    CEO_Login -->|Generate JWT Token| JWT["JWT Bearer Token"]
    CEO_Dashboard["CEO Dashboard"] -->|"Create HR Employee (/ceo/create-employee)"| DB_Users
    DB_Users -->|status: ACTIVE| HR_Login["HR Recruiter Login (/auth/login)"]
    HR_Login -->|Generate JWT Token| JWT
```

---

### Feature 2: Job Management & Publishing

```mermaid
flowchart TD
    CEO["CEO Dashboard"] -->|Create Job Posting| JobForm["Job Form (Title, Dept, Skills, Salary)"]
    JobForm -->|POST /recruitment/jobs| DB_Jobs[("jobs Table (company_name, status: published)")]
    DB_Jobs -->|GET /recruitment/jobs| CEO_JobsList["CEO Job List View"]
    DB_Jobs -->|GET /jobs/public| PublicJobBoard["Candidate Public Job Board (/jobs)"]
```

---

### Feature 3: AI Resume Screening & Parsing (Gmail Sync, Embeddings & LLM)

```mermaid
flowchart TD
    Candidate["Candidate / Gmail Inbox"] -->|Fetch email+resume| CandidateType{"candidate type?"}

    CandidateType --> |NewCandidate| StartProcessing[("Upsert CV+Application")]
    StartProcessing --> GenerateEmbedding 
    GenerateEmbedding --> AI["Generate RAG + LLM Score"]
    AI --> DB_Apps[("Upsert Applications (match_score, skill_gap, summary)")]
    DB_Apps -->|Score >= 85%| Shortlisted["status: shortlisted"]
    DB_Apps -->|Score < 85%| Screened["status: screened"]
    Shortlisted & Screened --> END

    CandidateType --> |Existing| StatusType{"status?"}

    StatusType ----> |"hired | accepted"| END
    StatusType --> |"screened | scheduled | shortlisted | applied"| StartProcessing 

```

---

### Feature 4: Automated Interview Scheduling & Candidate Self-Scheduling Portal

```mermaid
flowchart TD
    Interviewer["HR / CEO Dashboard"] -->|Create Time Slots| DB_Slots[("interview_slots Table")]
    Interviewer -->|Generate Candidate Self-Schedule Link| TokenGen["7-Day Crypto Token Generator"]
    TokenGen -->|POST /interviews/{id}/self-schedule-link| CandPortal["Candidate Portal (/interview/schedule/:token)"]
    CandPortal -->|Select Slot & Confirm| SlotLock["Lock Slot (is_booked: True)"]
    SlotLock --> VideoGen["Meeting Generator (Google Meet / Jitsi Fallback)"]
    VideoGen -->|Save Interview Record| DB_Interviews[("interviews_v2 Table")]
    VideoGen --> iCalGen["RFC 5545 .ics Calendar Generator"]
    iCalGen -->|Download .ics File| CandPortal
```

---

### Feature 5: Interview Evaluation & AI Candidate Ranking Leaderboard

```mermaid
flowchart TD
    Interviewer["HR / Interviewer"] -->|Submit Interview Scorecard| FeedbackRoute["POST /recruitment/submit-feedback"]
    FeedbackRoute --> EvalEngine["Evaluation Agent Engine"]
    EvalEngine -->|Resume Score (40%) + Technical (40%) + Communication (20%)| Formula["Final Score Formula"]
    Formula --> Category["Assign Category (Strong Hire | Hire | Consider | Reject)"]
    Category --> DB_Scores[("final_scores Table")]
    DB_Scores -->|GET /recruitment/ranked-candidates/{job_id}| CEO_Leaderboard["CEO Ranked Candidate Leaderboard"]
```

---

### Feature 6: Offer Letter Management, Approval Queue & E-Signature Audit Certificate

```mermaid
flowchart TD
    HR["HR Recruiter"] -->|1. Draft Offer Letter| OfferTmpl["Offer Template Interpolator"]
    OfferTmpl -->|2. Status: PENDING_APPROVAL| DB_Approval[("offer_approvals Table")]
    DB_Approval -->|3. CEO Review & Approve| CEO_Approval["CEO Approves Offer"]
    CEO_Approval -->|4. Status: APPROVED| TokenGen["Generate 7-Day Crypto Offer Token"]
    TokenGen -->|5. Send Offer Link| CandSignPortal["Candidate Signing Portal (/offer/sign/:token)"]
    CandSignPortal -->|6. Canvas Signature + IP + UserAgent| AuditEngine["SHA-256 Audit Certificate Engine"]
    AuditEngine -->|7. Update Status: SIGNED| DB_Offers[("offers Table (audit_hash, signature_data)")]
    AuditEngine -->|8. Update App Status: HIRED| DB_Apps[("applications Table (status: hired)")]
```