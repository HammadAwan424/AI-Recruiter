from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database import get_db
from app.schemas.offer import OfferTemplateCreate, OfferTemplateResponse
from app.utils.security import get_current_user, require_permissions
from app.crud.offer import (
    list_active_templates_db,
    create_offer_template_db,
    update_offer_template_db,
)

router = APIRouter(prefix="/templates", tags=["Offer Templates"])


@router.get("/", response_model=List[OfferTemplateResponse])
def get_offer_templates(
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Lists all active offer templates."""
    return list_active_templates_db(db)


@router.post(
    "/",
    response_model=OfferTemplateResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def create_offer_template(
    payload: OfferTemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Creates a new offer template."""
    return create_offer_template_db(
        db=db,
        company_id=current_user.get("company_id"),
        title=payload.title,
        department=payload.department,
        content=payload.content,
        created_by=current_user["user_id"]
    )


@router.put(
    "/{template_id}",
    response_model=OfferTemplateResponse,
    dependencies=[Depends(require_permissions(["offer:generate"]))]
)
def update_offer_template(
    template_id: int,
    payload: OfferTemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Updates an existing offer template."""
    template = update_offer_template_db(
        db=db,
        template_id=template_id,
        title=payload.title,
        department=payload.department,
        content=payload.content,
        updated_by=current_user["user_id"]
    )
    if not template:
        raise HTTPException(status_code=404, detail="Offer template not found")
    return template
