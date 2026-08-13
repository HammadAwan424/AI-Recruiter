import time
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import CORS_ORIGINS
from app.routes import (
    auth,
    admin,
    user as user_routes,
    job as job_routes,
    job_description,
    application as application_routes,
    offer as offer_routes,
    template as template_routes,
    approval as approval_routes,
    interview as interview_routes
)

from app.utils.logger import get_logger

# ──── Initialize Centralized Logging ────
logger = get_logger("root", log_file="webserver.log")

app = FastAPI()

# ──── Request Logging Middleware ────
@app.middleware("http")
async def log_requests_with_time(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start_time) * 1000
    logger.info(
        f"{request.method} {request.url.path} - Status: {response.status_code} - {duration_ms:.2f}ms"
    )
    return response

# ──── CORS ────
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──── Routers ────
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(user_routes.router)
app.include_router(job_routes.router)
app.include_router(job_description.router)
app.include_router(application_routes.router)
app.include_router(template_routes.router)
app.include_router(approval_routes.router)
app.include_router(offer_routes.router)
app.include_router(interview_routes.router)


@app.get("/")
def home():
    return {"message": "Backend running"}