from fastapi import APIRouter
from .crud import router as crud_router
from .public import router as public_router

router = APIRouter(
    prefix="/offers",
    tags=["Offers"]
)

# Unauthenticated public endpoints (Candidate E-Signature & Declination)
router.include_router(public_router)

# Authenticated CRUD & Decision endpoints
router.include_router(crud_router)
