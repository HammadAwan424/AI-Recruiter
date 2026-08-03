from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import CORS_ORIGINS
from app.routes import auth, admin, user as user_routes, job as job_routes, application as application_routes, offer as offer_routes, interview as interview_routes

app = FastAPI()

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
app.include_router(application_routes.router)
app.include_router(offer_routes.router)
app.include_router(interview_routes.router)


@app.get("/")
def home():
    return {"message": "Backend running"}