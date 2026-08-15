from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Query, Session

from app.database import get_db
from app.models.offer import Offer
from app.schemas.offer import (
    OfferCreate,
    OfferUpdate,
    OfferResponse,
)
from app.schemas.offer_approval import ExecutiveOfferDecision
from app.utils.security import (
    get_current_user,
    require_permissions,
    get_scoped_offers_query,
    get_offer_or_403
)
from app.services.offer_service import (
    create_offer_service,
    list_offers_service,
    record_executive_decision_service,
    delete_offer_service,
    ensure_offer_is_internal,
    offer_to_response,
)

router = APIRouter(tags=["Offers CRUD"])


@router.post(
    "/",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def create_offer(
    payload: OfferCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Creates an offer, generates pending approval, and sets application status to offer_approval."""
    return create_offer_service(db=db, payload=payload, current_user=current_user)


@router.get("/", response_model=List[OfferResponse],
    dependencies=[Depends(require_permissions(["offer:view"]))]
)
def list_offers(
    db: Session = Depends(get_db),
    offers_query: Query = Depends(get_scoped_offers_query),
):
    """Lists offers formatted with status metadata."""
    return list_offers_service(db=db, offers_query=offers_query)


@router.get("/{offer_id}", response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:view"]))]
)
def get_offer_detail(
    offer: Offer = Depends(get_offer_or_403)
):
    """Gets details for a single offer."""
    return offer_to_response(offer)


@router.put(
    "/{offer_id}",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def update_offer(
    payload: OfferUpdate,
    offer: Offer = Depends(get_offer_or_403),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates an offer before it has been sent to the candidate."""
    ensure_offer_is_internal(offer)
    update_data = payload.model_dump(exclude_unset=True)
    next_start = update_data.get("start_date", offer.start_date)
    next_expiry = update_data.get("expiry_date", offer.expiry_date)
    if next_expiry and next_expiry <= next_start:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="expiry_date must be after start_date",
        )
    offer.update_from_dict(update_data)
    offer.updated_by = current_user["user_id"]
    db.commit()
    db.refresh(offer)
    return offer_to_response(offer)


@router.post(
    "/{offer_id}/decisions",
    response_model=OfferResponse,
    dependencies=[Depends(require_permissions(["offer:approve"]))]
)
def record_executive_offer_decision(
    offer_id: int,
    payload: ExecutiveOfferDecision = Body(..., discriminator="decision"),
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Executive sign-off decision endpoint (Requires offer:approve permission).
    Accepts Discriminated Union ExecutiveOfferDecision (discriminator='decision'):
    1. decision='approved': Generates secure token, sets application status to offer_sent, dispatches email
    2. decision='rejected': Sets application status & disposition to rejected
    """
    return record_executive_decision_service(
        db=db,
        offer_id=offer_id,
        decision_payload=payload,
        current_user=current_user
    )


@router.delete(
    "/{offer_id}",
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Deletes offer and associated approval, reverting application stage to interview."""
    return delete_offer_service(db=db, offer_id=offer_id, current_user=current_user)
