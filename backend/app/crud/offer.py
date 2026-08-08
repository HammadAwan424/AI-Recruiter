from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.schemas.offer import OfferCreate, OfferTemplateCreate


def get_offer_by_token_db(db: Session, token: str) -> Optional[Offer]:
    """Retrieves an Offer by secure token."""
    return db.query(Offer).filter(Offer.secure_token == token).first()


def create_offer_db(db: Session, offer_in: OfferCreate, created_by: Optional[int] = None) -> Offer:
    """Inserts a new Offer record into database."""
    data = offer_in.model_dump()
    offer = Offer(**data, created_by=created_by)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def create_offer_approval_db(
    db: Session,
    offer_id: int,
    approver_id: int,
    comments: Optional[str] = None,
    created_by: Optional[int] = None
) -> OfferApproval:
    """Inserts an OfferApproval record into database."""
    approval = OfferApproval(
        offer_id=offer_id,
        approver_id=approver_id,
        comments=comments,
        created_by=created_by,
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)
    return approval


def list_active_templates_db(db: Session) -> List[OfferTemplate]:
    """Lists all active OfferTemplates."""
    return db.query(OfferTemplate).filter(OfferTemplate.is_active).all()


def create_offer_template_db(
    db: Session,
    company_id: Optional[int],
    title: str,
    department: str,
    content: str,
    created_by: int
) -> OfferTemplate:
    """Inserts a new OfferTemplate record into database."""
    template = OfferTemplate(
        company_id=company_id,
        title=title,
        department=department or "GLOBAL",
        content=content,
        created_by=created_by
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


def update_offer_template_db(
    db: Session,
    template_id: int,
    title: str,
    department: str,
    content: str,
    updated_by: int
) -> Optional[OfferTemplate]:
    """Updates an existing OfferTemplate in database."""
    template = db.query(OfferTemplate).filter(OfferTemplate.id == template_id).first()
    if not template:
        return None

    template.title = title
    template.department = department or "GLOBAL"
    template.content = content
    template.updated_by = updated_by

    db.commit()
    db.refresh(template)
    return template
