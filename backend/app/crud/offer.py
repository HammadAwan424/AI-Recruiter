from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.offer import Offer, OfferTemplate, OfferApproval
from app.schemas.offer import OfferCreate, OfferApprovalAction


def create_offer(db: Session, offer_in: OfferCreate, created_by: Optional[int] = None) -> Offer:
    data = offer_in.model_dump()
    offer = Offer(**data, created_by=created_by)
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer


def create_offer_approval(db: Session, offer_id: int, approver_id: int, comments: Optional[str] = None, created_by: Optional[int] = None) -> OfferApproval:
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
