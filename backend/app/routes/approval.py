from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.models.offer import OfferApproval
from app.utils.security import get_current_user, require_permissions

router = APIRouter(prefix="/approvals", tags=["Offer Approvals"])


@router.get(
    "/",
    dependencies=[Depends(require_permissions(["offer:view"]))]
)
def list_offer_approvals(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    approvals = db.query(OfferApproval).order_by(OfferApproval.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "offer_id": a.offer_id,
            "approver_id": a.approver_id,
            "comments": a.comments,
            "decided_at": a.decided_at.isoformat() if a.decided_at else None,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in approvals
    ]


@router.get(
    "/{approval_id}",
    dependencies=[Depends(require_permissions(["offer:view"]))]
)
def get_offer_approval_detail(
    approval_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    approval = db.query(OfferApproval).filter(OfferApproval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Offer approval record not found")

    return {
        "id": approval.id,
        "offer_id": approval.offer_id,
        "approver_id": approval.approver_id,
        "comments": approval.comments,
        "decided_at": approval.decided_at.isoformat() if approval.decided_at else None,
        "created_at": approval.created_at.isoformat() if approval.created_at else None,
    }
