from datetime import date, datetime, timedelta
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.utils.offer_crypto import generate_secure_offer_token


def seed_offers(db, users_context, applications, jobs):
    print("🔹 [Level 5] Generating Offer Templates, Active Offers, Approvals & Signatures (Batched)...")
    ceo_user = users_context["ceo"]

    # 1. Multi-Department Offer Templates
    templates_data = [
        {
            "title": "Standard Executive Offer Package",
            "department": "GLOBAL",
            "content": (
                "Dear {{candidate_name}},\n\n"
                "On behalf of {{company_name}}, I am delighted to extend to you a formal offer of employment for the position of {{job_title}} within our {{department}} department. We were exceptionally impressed by your technical expertise, professional achievements, and alignment with our corporate vision during the evaluation process. We firmly believe that your leadership and skills will play a critical role in accelerating our growth and strategic goals.\n\n"
                "Your starting annual base salary will be {{base_salary}}, payable in bi-weekly installments in accordance with {{company_name}}'s standard payroll schedules. In addition to your base compensation, your package includes the following incentive terms: {{bonus_equity}}. You will also be eligible for our full corporate benefits suite, including comprehensive medical, dental, and vision coverage, 401(k) retirement matching, flexible paid time off (PTO), and professional development stipends.\n\n"
                "Your targeted employment start date will be {{start_date}}. In this role, you will report directly to the leadership team within {{department}}. Please note that this offer is contingent upon the satisfactory completion of standard pre-employment background verifications and proof of legal work authorization.\n\n"
                "Please review the terms outlined above carefully. To accept this offer, please execute your electronic signature via our secure candidate portal on or before {{expiry_date}}, after which date this offer package will expire. Should you have any questions or require further details regarding your compensation or benefits, please do not hesitate to contact our Talent Acquisition team.\n\n"
                "We are thrilled about the prospect of welcoming you to {{company_name}} and building the future together!\n\n"
                "Sincerely,\n\n"
                "Executive Hiring Committee\n"
                "{{company_name}}"
            ),
        },
        {
            "title": "Senior Engineering Offer Letter",
            "department": "ENGINEERING",
            "content": (
                "Dear {{candidate_name}},\n\n"
                "We are thrilled to offer you the position of {{job_title}} in the {{department}} team at {{company_name}}. The interviewing team was unanimously impressed by your deep technical proficiency, system architecture knowledge, and problem-solving skills.\n\n"
                "Your initial base compensation for this position will be {{base_salary}} per year, alongside the following equity and bonus structure: {{bonus_equity}}. You will be eligible for 100% employer-covered health coverage, 401(k) matching, and annual technology stipends.\n\n"
                "Your official start date is scheduled for {{start_date}}. Please review and sign this agreement before {{expiry_date}} using the secure link provided.\n\n"
                "Welcome aboard!\n\n"
                "Engineering Leadership\n"
                "{{company_name}}"
            ),
        },
        {
            "title": "Sales & Revenue Leadership Offer",
            "department": "SALES",
            "content": (
                "Dear {{candidate_name}},\n\n"
                "On behalf of {{company_name}}, we are pleased to offer you the role of {{job_title}} within our {{department}} team.\n\n"
                "Your base salary will be {{base_salary}} annually, supplemented by our uncapped commission and incentive structure: {{bonus_equity}}. Your anticipated start date will be {{start_date}}.\n\n"
                "Please sign and return your accepted offer by {{expiry_date}}.\n\n"
                "Warm regards,\n\n"
                "Revenue & Growth Team\n"
                "{{company_name}}"
            ),
        },
    ]

    seeded_templates = [
        OfferTemplate(
            company_id=ceo_user.company_id,
            title=t_data["title"],
            department=t_data["department"],
            content=t_data["content"],
            is_active=True,
            created_by=ceo_user.id,
        )
        for t_data in templates_data
    ]
    db.add_all(seeded_templates)
    db.flush()

    main_template = seeded_templates[0]

    # 2. Offer for Candidate in 'offer_sent' stage (David Kim - Job 1, App 5) -> Status: SENT
    app_sent = applications[4]
    token = generate_secure_offer_token()
    offer_sent = Offer(
        application_id=app_sent.id,
        template_id=main_template.id if main_template else None,
        base_salary=145000.0,
        bonus_equity="$10,000 Signing Bonus + 5,000 Options",
        start_date=date.today() + timedelta(days=14),
        expiry_date=date.today() + timedelta(days=7),
        offer_letter_text=(
            "Dear David Kim,\n\n"
            "On behalf of AI Recruiter, I am delighted to extend to you a formal offer of employment for the position of Senior Full Stack Engineer within our Engineering department. We were exceptionally impressed by your technical expertise during the evaluation process.\n\n"
            "Your starting annual base salary will be $145,000. In addition, your package includes $10,000 Signing Bonus + 5,000 Options. Your targeted start date will be "
            + str(date.today() + timedelta(days=14))
            + ".\n\n"
            "Sincerely,\nAI Recruiter Team"
        ),
        secure_token=token,
        token_expires_at=datetime.utcnow() + timedelta(days=7),
        status="SENT",
        created_by=ceo_user.id,
    )

    # 3. Offer Approval for Candidate in 'offer_approval' stage (Elena Rostova - Job 1, App 4) -> Status: PENDING_APPROVAL
    app_approval = applications[3]
    offer_pending = Offer(
        application_id=app_approval.id,
        template_id=main_template.id if main_template else None,
        base_salary=155000.0,
        bonus_equity="15% Performance Bonus + 2,500 Stock Options",
        start_date=date.today() + timedelta(days=21),
        expiry_date=date.today() + timedelta(days=7),
        offer_letter_text=(
            "Dear Elena Rostova,\n\n"
            "On behalf of AI Recruiter, we are pleased to offer you the position of AI / ML Engineer within our Engineering department. Your annual starting salary will be $155,000 with 15% Performance Bonus + 2,500 Stock Options.\n\n"
            "Target start date: " + str(date.today() + timedelta(days=21)) + ".\n\n"
            "Sincerely,\nExecutive Committee"
        ),
        status="PENDING_APPROVAL",
        created_by=ceo_user.id,
    )

    # 4. Signed Offer for Hired Candidate (Olivia Taylor - Job 1, App 6) -> Status: SIGNED
    app_hired = applications[5]
    offer_signed = Offer(
        application_id=app_hired.id,
        template_id=main_template.id if main_template else None,
        base_salary=160000.0,
        bonus_equity="$15,000 Signing Bonus + 8,000 Options",
        start_date=date.today() - timedelta(days=5),
        expiry_date=date.today() + timedelta(days=7),
        offer_letter_text=(
            "Dear Olivia Taylor,\n\n"
            "On behalf of AI Recruiter, we are delighted to confirm your accepted offer of employment as Lead Full Stack Architect. "
            "Welcome to the team!\n\n"
            "Annual Base Salary: $160,000\n"
            "Bonus / Equity: $15,000 Signing Bonus + 8,000 Options\n\n"
            "Sincerely,\nAI Recruiter Executive Team"
        ),
        status="SIGNED",
        signature_type="DRAWN",
        signer_name="Olivia Taylor",
        signed_at=datetime.utcnow() - timedelta(days=3),
        audit_hash="SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        created_by=ceo_user.id,
    )

    # Bulk add offers to obtain IDs
    offers = [offer_sent, offer_pending, offer_signed]
    db.add_all(offers)
    db.flush()

    # Link approval to offer_pending
    appr2 = OfferApproval(
        offer_id=offer_pending.id,
        approver_id=ceo_user.id,
        comments="Draft offer package approved by CEO.",
        created_by=ceo_user.id,
    )
    db.add(appr2)
    db.commit()

    print(
        f"  ✓ Level 5 Complete: {len(seeded_templates)} Offer Templates, "
        f"{len(offers)} Active Offers (1 SENT, 1 PENDING_APPROVAL, 1 SIGNED) in 1 transaction."
    )

    if offer_sent.secure_token:
        print(f"\n🎉 Candidate Offer Signing Test Link:\n   http://localhost:5173/offer/sign/{offer_sent.secure_token}")
        print("🎉 Candidate Self-Scheduling Test Link:\n   http://localhost:5173/interviews/schedule/mock_self_sched_token_001\n")

    return offers
