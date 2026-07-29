# 📄 AI Recruiter System Specifications

---

## 1. Offer Management, Approvals, and Electronic Signature

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR / Recruiter
    actor Manager as Dept Manager / CEO
    actor Candidate as Candidate
    participant BE as FastAPI Backend
    participant DB as Database (SQLAlchemy)

    HR->>BE: 1. Create Offer (Draft or Direct Submit for Approval)
    BE->>DB: Save Offer (Status: DRAFT or PENDING_APPROVAL)
    Manager->>BE: 2. Review & Approve Offer (with comments)
    BE->>DB: Update Approval & Set Status APPROVED
    HR->>BE: 3. Send Offer to Candidate
    BE->>BE: 4. Generate 7-Day Secure Candidate Token
    BE->>DB: Update Offer (Status: SENT)
    Candidate->>BE: 5. Access Public Link GET /api/offers/public/{token}
    BE-->>Candidate: Offer Letter & E-Signature Canvas
    Candidate->>BE: 6. Submit Signature (Draw/Type + Consent)
    BE->>BE: 7. Compute Canonical JSON SHA-256 Audit Hash
    BE->>DB: Save Signed Offer (Status: SIGNED) & Update Candidate (Status: HIRED)
    BE-->>Candidate: Success Page with Downloadable / Printable Audit Certificate
```

### Critical Decisions
- Used explicit `"GLOBAL"` sentinel value for `OfferTemplate.department` to enable B-tree index seeks without performance-degrading `OR IS NULL` SQL table scans.

### File Changes

**Modified:**
- `backend/app/database.py`: Added `BaseModelMixin` (`from_dict()` & `update_from_dict()`) to automate dictionary payload mapping onto SQLAlchemy models.
- `backend/app/config.py`: Centralized environment variable parsing (`python-dotenv`) for dynamic database URLs and security settings.
- `frontend/src/components/ceo/Dashboard.jsx`: Integrated `Offer Letters` tab and navigation item into CEO dashboard.

**Created:**
- `backend/app/models/offer.py`
- `backend/app/schemas/offer.py`
- `backend/app/utils/offer_crypto.py`
- `backend/app/routes/offer.py`
- `frontend/src/components/ceo/OfferManagementTab.jsx`
- `frontend/src/components/pages/CandidateOfferSignPage.jsx`

---

## 2. Automated Interview Scheduling (P0)

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR / Recruiter
    actor Candidate as Candidate
    participant BE as FastAPI Backend
    participant DB as Database (SQLAlchemy)
    participant Engine as iCal & Video Engine

    HR->>BE: 1. Define Interviewer Slots or Schedule Direct
    BE->>DB: Save Slots & Generate 7-Day Candidate Token
    HR->>BE: 2. Send Self-Schedule Link to Candidate
    Candidate->>BE: 3. Open Portal (GET /api/interviews/public/slots/{token})
    BE-->>Candidate: Available Slots & Interviewers
    Candidate->>BE: 4. Select Preferred Slot (POST /api/interviews/public/schedule/{token})
    BE->>Engine: 5. Generate Google Meet / Jitsi Link & iCal (.ics) Invite
    BE->>DB: Save Interview (Status: SCHEDULED) & Mark Slot Booked
    BE-->>Candidate: Confirmation & "Add to Google/Outlook Calendar" Buttons
```

### Critical Decisions
- Used numeric `0` sentinel value for `InterviewSlot.job_id` to represent universal interviewer availability across all job postings.

### File Changes

**Modified:**
- `frontend/src/components/ceo/InterviewsTab.jsx`: Added Agenda vs Slots view switcher, direct Join Call launcher, `.ics` calendar downloader, slot builder modal, and self-schedule link generator.

**Created:**
- `backend/app/models/interview.py`
- `backend/app/schemas/interview.py`
- `backend/app/utils/meeting_generator.py`
- `backend/app/utils/ical_generator.py`
- `backend/app/utils/interview_crypto.py`
- `backend/app/routes/interview.py`
- `frontend/src/components/pages/CandidateSelfSchedulePage.jsx`

---

## 3. Core Application Entrypoints

**Modified:**
- `backend/app/main.py`: Registers new SQLAlchemy model metadata for automatic table creation on startup (`metadata.create_all`) and includes feature API routers into the main FastAPI application.
- `frontend/src/App.jsx`: Registers new public and protected React Router paths (e.g., `/offer/sign/:token` and `/interview/schedule/:token`) to render client-facing web pages.
