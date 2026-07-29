from datetime import date, datetime, timedelta
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.utils.offer_crypto import generate_secure_offer_token

def seed_offers(db, applications, jobs, ceo_user):
    print("🔹 [Level 5] Generating Offer Templates, Active Offers & Approvals...")

    job_fs = jobs[0]
    job_ai = jobs[1]

    # 1. Offer Template
    tmpl = db.query(OfferTemplate).filter(OfferTemplate.title == "Standard Full-Time Offer").first()
    if not tmpl:
        tmpl = OfferTemplate(
            title="Standard Full-Time Offer",
            department="GLOBAL",
            content="Dear {{candidate_name}},\n\nWe are excited to offer you the position of {{job_title}} at {{company_name}}.",
            is_active=True
        )
        db.add(tmpl)
        db.commit()

    offers_created = []

    # 2. Offer 1 (Status: SENT) -> Linked to Application 1 (Sophia Chen for AI Engineer)
    app1 = applications[1]
    offer1 = db.query(Offer).filter(Offer.application_id == app1.id).first()
    if not offer1:
        token = generate_secure_offer_token()
        offer1 = Offer(
            application_id=app1.id,         # Read directly from application object
            candidate_id=app1.candidate_id, # Read directly from application object
            job_id=app1.job_id,             # Read directly from application object
            created_by_user_id=ceo_user.id, # Read directly from named parameter
            job_title=job_ai.title,
            department=job_ai.department,
            base_salary=145000.0,
            bonus_equity="10% Annual Bonus + 5,000 Options",
            start_date=date.today() + timedelta(days=14),
            expiry_date=date.today() + timedelta(days=7),
            offer_letter_text="Dear Sophia Chen,\n\nWe are thrilled to offer you the position of AI / ML Engineer at Agentra AI.",
            status="SENT",
            secure_token=token,
            token_expires_at=datetime.utcnow() + timedelta(days=7)
        )
        db.add(offer1)
        db.commit()
        db.refresh(offer1)
    offers_created.append(offer1)

    # 3. Offer 2 (Status: PENDING_APPROVAL) -> Linked to Application 2 (Marcus Vance for Full Stack)
    app2 = applications[2]
    offer2 = db.query(Offer).filter(Offer.application_id == app2.id).first()
    if not offer2:
        offer2 = Offer(
            application_id=app2.id,         # Read directly from application object
            candidate_id=app2.candidate_id, # Read directly from application object
            job_id=app2.job_id,             # Read directly from application object
            created_by_user_id=ceo_user.id, # Read directly from named parameter
            job_title=job_fs.title,
            department=job_fs.department,
            base_salary=135000.0,
            bonus_equity="15% Performance Bonus + 2,500 Options",
            start_date=date.today() + timedelta(days=21),
            expiry_date=date.today() + timedelta(days=7),
            offer_letter_text="Dear Marcus Vance,\n\nWe are pleased to offer you the position of Senior Full Stack Engineer.",
            status="PENDING_APPROVAL"
        )
        db.add(offer2)
        db.commit()
        db.refresh(offer2)

        appr2 = db.query(OfferApproval).filter(OfferApproval.offer_id == offer2.id).first()
        if not appr2:
            appr2 = OfferApproval(
                offer_id=offer2.id,       # Read directly from offer object
                approver_id=ceo_user.id,   # Read directly from named parameter
                step_order=1,
                status="PENDING"
            )
            db.add(appr2)
            db.commit()
    offers_created.append(offer2)

    print(f"  ✓ Level 5 Complete: {len(offers_created)} Offers created (1 SENT, 1 PENDING_APPROVAL).")

    if offer1.secure_token:
        print(f"\n🎉 Candidate Signing Test Link:\n   http://localhost:5173/offer/sign/{offer1.secure_token}\n")

    return offers_created
