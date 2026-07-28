from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, SessionLocal
from app.models import user, recruitment, offer  # ← naya
from app.routes import auth, admin, ceo, recruitment as recruitment_routes, offer as offer_routes  # ← naya
from app.utils.security import hash_password

app = FastAPI()

# ──── CORS ────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for dev/testing candidate access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──── Tables create ────
user.Base.metadata.create_all(bind=engine)
recruitment.Base.metadata.create_all(bind=engine)
offer.Base.metadata.create_all(bind=engine)  # ← offer tables create


# SUPER ADMIN CREATE FUNCTION
def create_super_admin():

    db: Session = SessionLocal()

    admin_user = db.query(user.User).filter(user.User.role == "superadmin").first()

    if not admin_user:

        new_admin = user.User(
            full_name="Super Admin",
            email="admin@agentra.com",
            password=hash_password("admin123"),
            role="superadmin",
            status="active"
        )

        db.add(new_admin)
        db.commit()

    db.close()


# run function when server starts
create_super_admin()


# ──── Routers ────
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(ceo.router)
app.include_router(recruitment_routes.router)
app.include_router(offer_routes.router)  # ← offer router include


@app.get("/")
def home():
    return {"message": "Backend running"}