from datetime import date, datetime, timedelta
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.utils.offer_crypto import generate_secure_offer_token

def seed_offers(db, users_context, applications, jobs):
    print("🔹 [Level 5] Generating Offer Templates, Active Offers & Approvals...")
    ceo_user = users_context["ceo"]

    # 1. Offer Template
    tmpl = db.query(OfferTemplate).filter(OfferTemplate.title == "Standard Full-Time Offer").first()
    if not tmpl:
        tmpl = OfferTemplate(
            company_id=ceo_user.company_id,
            title="Standard Full-Time Offer",
            department="GLOBAL",
            content="Dear {{candidate_name}},\n\nWe are excited to offer you the position of {{job_title}} at {{company_name}}.",
            is_active=True,
            created_by=ceo_user.id
        )
        db.add(tmpl)
        db.commit()

    offers_created = []

    # 2. Offer for Candidate in 'offer_sent' stage (index 4 - David Kim)
    app_sent = applications[4]
    offer1 = db.query(Offer).filter(Offer.application_id == app_sent.id).first()
    if not offer1:
        token = generate_secure_offer_token()
        offer1 = Offer(
            application_id=app_sent.id,
            template_id=tmpl.id if tmpl else None,
            base_salary=145000.0,
            bonus_equity="10% Annual Bonus + 5,000 Options",
            start_date=date.today() + timedelta(days=14),
            expiry_date=date.today() + timedelta(days=7),
            offer_letter_text="Dear David Kim,\n\nWe are thrilled to offer you the position of Senior Full Stack Engineer at AI Recruiter.",
            secure_token=token,
            token_expires_at=datetime.utcnow() + timedelta(days=7),
            created_by=ceo_user.id
        )
        db.add(offer1)
        db.commit()
        db.refresh(offer1)
    offers_created.append(offer1)

    # 3. Offer Approval for Candidate in 'offer_approval' stage (index 3 - Elena Rostova)
    app_approval = applications[3]
    offer2 = db.query(Offer).filter(Offer.application_id == app_approval.id).first()
    if not offer2:
        offer2 = Offer(
            application_id=app_approval.id,
            template_id=tmpl.id if tmpl else None,
            base_salary=155000.0,
            bonus_equity="15% Performance Bonus + 2,500 Options",
            start_date=date.today() + timedelta(days=21),
            expiry_date=date.today() + timedelta(days=7),
            offer_letter_text="Dear Elena Rostova,\n\nWe are pleased to offer you the position of AI / ML Engineer at AI Recruiter.",
            created_by=ceo_user.id
        )
        db.add(offer2)
        db.commit()
        db.refresh(offer2)

        appr2 = db.query(OfferApproval).filter(OfferApproval.offer_id == offer2.id).first()
        if not appr2:
            appr2 = OfferApproval(
                offer_id=offer2.id,
                approver_id=ceo_user.id,
                comments="Draft offer approved by CEO.",
                created_by=ceo_user.id
            )
            db.add(appr2)
            db.commit()
    offers_created.append(offer2)

    print(f"  ✓ Level 5 Complete: {len(offers_created)} Offers & Approvals created.")

    if offer1.secure_token:
        print(f"\n🎉 Candidate Signing Test Link:\n   http://localhost:5173/offer/sign/{offer1.secure_token}\n")

    return offers_created
