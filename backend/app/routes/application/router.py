from fastapi import APIRouter, Depends
from app.utils.security import get_job_or_403
from .crud import router as crud_router
from .screen import router as screen_router
from .public import router as public_router
from .comments import router as comments_router

router = APIRouter(
    prefix="/jobs/{job_id}/applications",
    tags=["Applications & Candidates"]
)

# Public Candidate Endpoint (No JWT authentication required) for applying
router.include_router(public_router)

# Authenticated HR Sub-Router (Requires JWT & Job Permissions)
authenticated_router = APIRouter(dependencies=[Depends(get_job_or_403)])
authenticated_router.include_router(crud_router)
authenticated_router.include_router(screen_router, prefix="/screen")
authenticated_router.include_router(comments_router, prefix="/{application_id}/comments")

router.include_router(authenticated_router)
