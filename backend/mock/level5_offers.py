from datetime import date, datetime, timedelta
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.utils.offer_crypto import generate_secure_offer_token

def seed_offers(db, users_context, applications, jobs):
    print("🔹 [Level 5] Generating Offer Templates, Active Offers & Approvals...")
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

    seeded_templates = []
    for t_data in templates_data:
        tmpl = db.query(OfferTemplate).filter(OfferTemplate.title == t_data["title"]).first()
        if not tmpl:
            tmpl = OfferTemplate(
                company_id=ceo_user.company_id,
                title=t_data["title"],
                department=t_data["department"],
                content=t_data["content"],
                is_active=True,
                created_by=ceo_user.id,
            )
            db.add(tmpl)
            db.commit()
            db.refresh(tmpl)
        seeded_templates.append(tmpl)

    main_template = seeded_templates[0]
    offers_created = []

    # 2. Offer for Candidate in 'offer_sent' stage (David Kim)
    app_sent = next((a for a in applications if a.current_status == "offer_sent"), applications[4] if len(applications) > 4 else applications[0])
    offer1 = db.query(Offer).filter(Offer.application_id == app_sent.id).first()
    if not offer1:
        token = generate_secure_offer_token()
        offer1 = Offer(
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
                + str(date.today() + timedelta(days=14)) + ".\n\n"
                "Sincerely,\nAI Recruiter Team"
            ),
            secure_token=token,
            token_expires_at=datetime.utcnow() + timedelta(days=7),
            created_by=ceo_user.id,
        )
        db.add(offer1)
        db.commit()
        db.refresh(offer1)
    offers_created.append(offer1)

    # 3. Offer Approval for Candidate in 'offer_approval' stage (Elena Rostova)
    app_approval = next((a for a in applications if a.current_status == "offer_approval"), applications[3] if len(applications) > 3 else applications[0])
    offer2 = db.query(Offer).filter(Offer.application_id == app_approval.id).first()
    if not offer2:
        offer2 = Offer(
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
            created_by=ceo_user.id,
        )
        db.add(offer2)
        db.commit()
        db.refresh(offer2)

        appr2 = db.query(OfferApproval).filter(OfferApproval.offer_id == offer2.id).first()
        if not appr2:
            appr2 = OfferApproval(
                offer_id=offer2.id,
                approver_id=ceo_user.id,
                comments="Draft offer package approved by CEO.",
                created_by=ceo_user.id,
            )
            db.add(appr2)
            db.commit()
    offers_created.append(offer2)

    print(f"  ✓ Level 5 Complete: {len(seeded_templates)} Offer Templates, {len(offers_created)} Active Offers & Approvals created.")

    if offer1.secure_token:
        print(f"\n🎉 Candidate Signing Test Link:\n   http://localhost:5173/offer/sign/{offer1.secure_token}\n")

    return offers_created
