from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.user import User
from app.utils.security import require_permissions

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_permissions(["superadmin"]))]
)


class StatusPayload(BaseModel):
    status: str  # active | inactive | pending | rejected


# Get CEOs list filtered by status
@router.get("/ceos")
def get_ceos(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(User).filter(User.role == "ceo")
    if status:
        query = query.filter(User.status == status)
    
    ceos = query.all()
    now = datetime.utcnow()
    result = []

    for ceo in ceos:
        if ceo.status == "active" and ceo.expires_at and now > ceo.expires_at:
            ceo.status = "inactive"
            db.commit()

        days_left = None
        if ceo.status == "active" and ceo.expires_at:
            days_left = (ceo.expires_at - now).days

        result.append({
            "id": ceo.id,
            "full_name": ceo.full_name,
            "email": ceo.email,
            "company_name": ceo.company.name if ceo.company else "",
            "status": ceo.status,
            "approved_at": ceo.approved_at.isoformat() if ceo.approved_at else None,
            "expires_at": ceo.expires_at.isoformat() if ceo.expires_at else None,
            "days_left": days_left
        })

    return result


# Update CEO Status
@router.put("/ceos/{ceo_id}/status")
def update_ceo_status(ceo_id: int, payload: StatusPayload, db: Session = Depends(get_db)):
    ceo = db.query(User).filter(User.id == ceo_id).first()
    if not ceo:
        raise HTTPException(status_code=404, detail="CEO account not found.")

    if payload.status not in ("active", "inactive", "pending", "rejected"):
        raise HTTPException(status_code=400, detail="Invalid status value. Must be active, inactive, pending, or rejected.")

    ceo.status = payload.status
    if payload.status == "active":
        ceo.approved_at = datetime.utcnow()
        ceo.expires_at = datetime.utcnow() + timedelta(days=30)

    db.commit()
    return {"message": f"CEO status updated to '{ceo.status}'.", "ceo_id": ceo.id, "status": ceo.status}


# Delete CEO
@router.delete("/ceos/{ceo_id}")
def delete_ceo(ceo_id: int, db: Session = Depends(get_db)):
    ceo = db.query(User).filter(User.id == ceo_id).first()
    if not ceo:
        raise HTTPException(status_code=404, detail="CEO account not found.")
    db.delete(ceo)
    db.commit()
    return {"message": "CEO account deleted successfully."}