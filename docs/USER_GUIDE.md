# User Guide: AI Recruiter Platform

## 1. Overview

AI Recruiter is an end-to-end recruitment platform designed to help hiring teams manage job openings, review applicants, schedule interviews, and extend job offers in one central workspace. Built for executive leaders, recruiters, hiring managers, and technical interviewers, the platform streamlines the entire hiring process—from publishing job requisitions and screening candidate resumes to conducting multi-round interviews and collecting digital signatures on offer letters.

---

## 2. Getting Started

### Company Registration & Account Approval
For new organization leaders, navigate to the sign-up page, enter your Full Name, Email, Company Name, and Password, and click **Create Account**. Your registration request will be submitted for platform administrator review. Once approved by an admin, your company account becomes active, default roles and permissions are automatically set up, and you can sign in to invite your hiring team.

### Logging In
To sign in to the platform, navigate to the web portal login page, enter your registered email address and password, and click **Sign In**. Once authenticated, you will be redirected to the platform interface and see only the navigation items and screens assigned to your account role.

### Navigation Overview
The left-hand sidebar gives you access to the main areas of the platform (depending on what your account role permits):

* **Company Management**: View and manage company registrations across the platform (visible to platform administrators).
* **Team & Permissions**: Invite new team members to your organization and manage user roles and permissions.
* **Job Requisitions**: Create, review, and manage open job positions and hiring team assignments.
* **Candidate Pipeline**: Track applicants through recruitment stages, review resumes, and manage candidate decisions.
* **Interviews**: Set up interviewer time slots, coordinate candidate interview scheduling, and submit evaluation feedback.
* **Offer Letters**: Draft offer templates, generate candidate offer letters, route offers for approval, and track signatures.
* **Settings**: View and update your personal account settings and profile information.

---

## 3. Role-Specific Capabilities

Access within the platform is tailored to your assigned role in the company. Below is a breakdown of what each role can see and do:

### Platform Super Admin
* **Company Registration Approvals**: Review pending company sign-up requests from organization leaders.
* **Account Status Control**: Approve, activate, deactivate, or decline company accounts across the platform.
* **Platform Maintenance**: Delete inactive or rejected organization accounts when necessary.

---

### CEO / Executive Admin
* **Full Organizational Access**: Complete access across Team & Permissions, Job Requisitions, Candidate Pipeline, and Interviews.
* **Team Management**: Invite new team members to your organization and manage their assigned roles and permissions.
* **Requisition Oversight**: Create new job requisitions, assign recruiters and hiring managers to openings, and monitor hiring progress company-wide.
* **Pipeline Oversight**: View all candidates across all positions, review compensation details, and manage candidate hiring decisions.
* **Interview & Offer Approvals**: Oversee interview schedules, review interviewer feedback scorecards, create offer letter templates, and grant final approval on candidate offer packages.

---

### Lead Recruiter
* **Requisition Management**: Draft, edit, publish, and close job requisitions. Assign hiring managers and co-recruiters to specific job openings.
* **Candidate Sourcing & Screening**: View all job applicants, review AI-assisted resume match analysis, inspect candidate compensation details, and manage candidate advancement or rejection.
* **Interview Coordination**: Manage interviewer availability slots, schedule fixed interview rounds, send candidate self-scheduling links, and review interview feedback.
* **Offer Generation**: Draft candidate offer letters using company templates and submit offers for internal approval. Once approved, the system automatically sends the offer package to the candidate.

---

### Hiring Manager
* **Assigned Job Visibility**: View and track hiring progress for job requisitions where you are assigned as the Hiring Manager.
* **Candidate Review & Decision-Making**: Review applicant profiles and resume summaries for your open roles, and mark candidates as active or rejected.
* **Interview Evaluation**: Participate in interview scheduling and review feedback scorecards from technical interviewers.
* **Offer Review & Approval**: Review drafted offer letters for your assigned positions and grant approval (or request changes). Upon approval, the system sends the offer package to the candidate.

---

### Tech Interviewer
* **Assigned Candidate Review**: View candidate profiles, resumes, and job details for candidates assigned to you for evaluation.
* **Schedule Coordination**: View your assigned interview times and meeting details.
* **Feedback Submission**: Submit structured interview evaluation scorecards rating candidate technical skills, communication abilities, and written feedback notes.

---

## 4. Core Workflows

### Workflow 1: Creating and Publishing a Job Requisition
1. Navigate to **Job Requisitions** in the sidebar.
2. Click the **Create Job** tab or button at the top of the page.
3. Fill in the position details: Job Title, Department, Employment Type (Full-time, Part-time, Contract), Experience Level, Salary Range, and Skills.
4. *(Optional)* Click **Generate with AI** to automatically draft a comprehensive job description and key skill requirements based on your job title and parameters.
5. In the **Hiring Team** section, select the assigned **Hiring Manager** and one or more **Recruiters** using the dropdown selectors.
6. Select any target distribution job boards (e.g. LinkedIn, Indeed, Glassdoor).
7. Click **Create & Publish Job**. The job opening will appear on your internal requisition list and public job portal.

---

### Workflow 2: Managing Candidates & Pipeline Progression
1. Navigate to **Candidate Pipeline** in the sidebar.
2. Review the Kanban pipeline columns representing the 6 sequential hiring stages:
   * **Applied**: New applications received from candidates.
   * **Screening**: AI resume parsing and match score evaluation.
   * **Interview**: Candidates undergoing active interview rounds.
   * **Offer Approval**: Candidates selected for an offer undergoing internal review.
   * **Offer Sent**: Candidates who have received an official offer letter.
   * **Hired**: Candidates who have signed and accepted their offer package.
3. **Advancing Candidates**: Drag a candidate’s card from their current stage column and drop it into the next stage column as they progress.
4. **Reviewing Candidate Details**: Click any candidate card to open their profile drawer. Here you can inspect extracted resume text, AI skill match breakdown, interview history, and compensation details (if permitted by your role).
5. **Dispositioning Candidates**: To reject a candidate, click **Reject Candidate** in their profile drawer or card menu. The candidate remains recorded in their current pipeline stage with a clear **Rejected** status tag, keeping historical context intact.

---

### Workflow 3: Setting Up Availability & Conducting Interviews
1. Navigate to **Interviews** in the sidebar.
2. **Adding Interviewer Availability**: Technical interviewers set up their available times by clicking **+ Add Time Slot**. Select the date, start time, end time, and optional job requisition, then click **Save Slot**.
3. **Scheduling an Interview**:
   * *Manual Booking*: Select a candidate in the Interview stage, choose an available time slot from the assigned interviewer, set the round number (e.g., Round 1), round label (e.g., Technical Deep Dive), and meeting type (Video Call or In-Person), then click **Schedule Interview**.
   * *Candidate Self-Scheduling*: Click **Copy Self-Schedule Link** to send the candidate a secure link where they can pick from available interviewer slots on their own.
4. **Adding to Calendar**: Click **Download .ics Calendar Invite** on any scheduled interview to export the meeting directly to your personal calendar application (Outlook, Google Calendar, Apple Calendar).
5. **Submitting Interview Scorecards**: After completing the interview, click **Submit Feedback** on the interview card. Rate the candidate's technical competency and communication skills, enter detailed written feedback notes, and save the scorecard.

---

### Workflow 4: Drafting, Approving, and Extending Offer Letters
1. Navigate to **Offer Letters** in the sidebar.
2. **Creating an Offer Template**: Click **+ New Template**. Enter a template title, department, and letter body text with candidate placeholders, then save.
3. **Drafting an Offer**: Select a candidate in the *Offer Approval* stage and click **Create Offer**. Choose an offer template, specify base salary, bonus/equity terms, start date, and offer expiration date, then click **Generate Offer**.
4. **Internal Approval**: The candidate moves to the *Offer Approval* stage on the candidate pipeline board. Designated approvers (CEO or Hiring Manager) review the compensation terms and letter text, then click **Approve Offer**.
5. **System Notification & Candidate E-Signature**: Upon approval, the system automatically advances the candidate to the *Offer Sent* stage and sends the candidate a secure digital signing link.
6. **Offer Acceptance**: The candidate opens their personalized link, reviews the offer letter, signs using their preferred method (drawing on the signature pad or typing their legal name), checks the legal consent box, and clicks **Sign & Accept Offer**. Upon completion, the candidate automatically advances to **Hired**.

---

## 5. Key Screens Reference

* **Company Management Screen**: A management dashboard for platform administrators to view, approve, activate, deactivate, or decline registered company accounts.
* **Team & Permissions Screen**: The user management workspace where authorized administrators can invite team members to the organization and configure user role permission matrices.
* **Job Requisitions Screen**: The central requisition hub listing all active and closed job openings. Includes controls to create positions, launch the AI Job Description Generator, assign hiring managers and recruiters, and manage distribution job boards.
* **Candidate Pipeline Screen**: An interactive Kanban board tracking candidates through the 6 hiring stages (*Applied $\rightarrow$ Screening $\rightarrow$ Interview $\rightarrow$ Offer Approval $\rightarrow$ Offer Sent $\rightarrow$ Hired*). Clicking any candidate card opens a slide-out drawer containing extracted resume text, AI skill match scores, interview history, and disposition controls.
* **Interview Management Screen**: The interview scheduling workspace featuring interviewer availability slot builders, interview round creation modals, candidate self-scheduling link generators, downloadable `.ics` calendar invites, and multi-interviewer scorecard feedback forms.
* **Offer Letters Screen**: The offer creation workspace containing offer letter template builders, offer package drafting forms, internal approval workflow queues, and candidate digital signature tracking.
* **Candidate Self-Scheduling Portal**: A public candidate page where applicants choose their preferred interview time slot from available interviewer times.
* **Candidate Digital Offer Signing Portal**: A public candidate page where selected candidates review their formal offer letter, select a signature method (drawing canvas or typed name), agree to terms, and submit their signed acceptance.
