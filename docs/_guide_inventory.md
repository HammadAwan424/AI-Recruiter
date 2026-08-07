# Codebase Feature Inventory

Source of truth inventory mapping UI screens, routes, gating permissions, user actions, and role permissions to verified codebase files.

---

## 1. Route & Guard Mapping

| Route Path | Component File | Guard / Permission Key | Confirmed File Location |
| :--- | :--- | :--- | :--- |
| `/` | `LoginPage.jsx` | Public | `frontend/src/features/auth/screens/LoginPage.jsx` |
| `/signup` | `SignupPage.jsx` | Public | `frontend/src/features/auth/screens/SignupPage.jsx` |
| `/jobs/portal` | `JobPortalPage/index.tsx` | Public | `frontend/src/features/jobs/screens/JobPortalPage/index.tsx` |
| `/offer/sign/:token` | `CandidateOfferSignPage/index.tsx` | Public | `frontend/src/features/offers/screens/CandidateOfferSignPage/index.tsx` |
| `/interview/schedule/:token` | `CandidateSelfSchedulePage/index.tsx` | Public | `frontend/src/features/interviews/screens/CandidateSelfSchedulePage/index.tsx` |
| `/admin` & `/admin/companies` | `CompanyManagementPage.tsx` | `superadmin` | `frontend/src/features/superadmin/screens/CompanyManagementPage.tsx` |
| `/users` | `UserManagementPage/index.tsx` | `user:` | `frontend/src/features/users/screens/UserManagementPage/index.tsx` |
| `/jobs` | `JobManagementPage/index.tsx` | `job:` | `frontend/src/features/jobs/screens/JobManagementPage/index.tsx` |
| `/candidates` | `CandidatePipelinePage/index.tsx` | `candidate:` | `frontend/src/features/candidates/screens/CandidatePipelinePage/index.tsx` |
| `/interviews` | `InterviewManagementPage/index.tsx` | `interview:` | `frontend/src/features/interviews/screens/InterviewManagementPage/index.tsx` |
| `/offers` | `OfferManagementPage/index.tsx` | `offer:` | `frontend/src/features/offers/screens/OfferManagementPage/index.tsx` |
| `/settings` | `SettingsPage/index.tsx` | Authenticated ProtectedRoute | `frontend/src/features/settings/screens/SettingsPage/index.tsx` |

---

## 2. Screen Actions Inventory

### A. Company Management (`/admin/companies`)
- **Verified Code Files**: `frontend/src/features/superadmin/screens/CompanyManagementPage.tsx`, `backend/app/routes/admin.py`
- **Actions**:
  - View CEO / Company sign-up requests (`GET /admin/ceos`).
  - Filter accounts by status (`active`, `pending`, `inactive`, `rejected`).
  - Update CEO status (`PUT /admin/ceos/{ceo_id}/status`).
  - Delete CEO / company account (`DELETE /admin/ceos/{ceo_id}`).

### B. Team & Permissions (`/users`)
- **Verified Code Files**: `frontend/src/features/users/screens/UserManagementPage/index.tsx`, `backend/app/routes/user.py`
- **Actions**:
  - View organization team members (`user:view`).
  - Invite team member via form (`user:invite`).
  - Edit Role Permissions Matrix & Job Scope (`user:change_permissions`).

### C. Job Requisitions (`/jobs`)
- **Verified Code Files**: `frontend/src/features/jobs/screens/JobManagementPage/index.tsx`, `JobFormModal.tsx`, `JobListTable/index.tsx`, `backend/app/routes/job.py`
- **Actions**:
  - View list of job requisitions (`job:view`).
  - Open Create Job form (`job:create`).
  - Generate Job Description with AI (`generate_job_description` agent).
  - Assign Hiring Manager and Recruiters (`disabled={!canAssignRecruiter}` checking `job:assign_recruiter`).
  - Delete job requisition (`job:create`).
  - Publish to distribution job boards (`distribute_job` agent).

### D. Candidate Pipeline (`/candidates`)
- **Verified Code Files**: `frontend/src/features/candidates/screens/CandidatePipelinePage/index.tsx`, `CandidateProfileDrawer.tsx`, `backend/app/routes/application/`
- **Actions**:
  - View Kanban board across 6 stages: **Applied $\rightarrow$ Screening $\rightarrow$ Interview $\rightarrow$ Offer Approval $\rightarrow$ Offer Sent $\rightarrow$ Hired** (`candidate:view`).
  - Drag and drop candidates between hiring stages (`candidate:view`).
  - Open Candidate Profile Drawer to inspect resume text, match score, and skill gaps (`candidate:view`).
  - View compensation details inside drawer (`candidate:view_compensation`).
  - Reject candidate or update disposition status (`candidate:disposition`).

### E. Interviews (`/interviews`)
- **Verified Code Files**: `frontend/src/features/interviews/screens/InterviewManagementPage/index.tsx`, `CandidateSelfSchedulePage/index.tsx`, `backend/app/routes/interview.py`
- **Actions**:
  - View scheduled interviews and slot builder (`interview:view`).
  - Add or delete interviewer time slots (`interview:create`).
  - Edit interviewer time slots (`interview:reschedule`).
  - Schedule fixed interview round (`interview:create`).
  - Copy candidate self-scheduling link (`interview:create`).
  - Download `.ics` calendar invite link (`GET /interviews/{id}/ical`).
  - Submit interview scorecard & ratings (`interview:submit_feedback`).

### F. Offer Letters (`/offers`)
- **Verified Code Files**: `frontend/src/features/offers/screens/OfferManagementPage/index.tsx`, `CandidateOfferSignPage/index.tsx`, `backend/app/routes/offer.py`
- **Actions**:
  - Create offer letter template (`offer:generate`).
  - Generate candidate offer letter (`offer:generate`).
  - Approve or reject generated offer (`offer:approve`).
  - Copy candidate e-signature link (`offer:generate`).
  - Public Candidate E-Signature (`POST /offers/public/{token}/sign`).

---

## 3. Seeded Roles & Permission Matrix

- **`superadmin`**: Wildcard `*` permissions across all companies and routes.
- **`ceo`**: `user:`, `job:`, `candidate:`, `interview:`, `offer:`, `profile:update`.
- **`recruiter`**: `job:create`, `job:close`, `job:assign_recruiter`, `job:view`, `candidate:`, `interview:`, `offer:generate`, `offer:view`, `profile:update`.
- **`hiring_manager`**: `job:view`, `candidate:disposition`, `candidate:view`, `interview:`, `offer:`, `profile:update`.
- **`interviewer`**: `job:view`, `candidate:view`, `interview:submit_feedback`, `profile:update`.
