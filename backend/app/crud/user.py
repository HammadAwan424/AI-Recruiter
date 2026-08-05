from sqlalchemy.orm import Session
from app.models.user import User
from app.models.company import Company
from app.utils.security import hash_password
from app.utils.security_seeder import seed_default_roles
import secrets
import string


# CEO create karna (Refactored to create/find Company and set company_id)
def create_ceo(db: Session, data):
    hashed = hash_password(data.password)

    # Find or create Company record
    company = db.query(Company).filter(Company.name == data.company_name).first()
    if not company:
        company = Company(name=data.company_name)
        db.add(company)
        db.commit()
        db.refresh(company)

    # Seed default roles (ceo, recruiter, hiring_manager, interviewer) & permissions for the company
    seed_default_roles(db, company_id=company.id)

    new_user = User(
        full_name=data.full_name,
        email=data.email,
        password=hashed,
        role="ceo",
        company_id=company.id,
        status="pending"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# email se user find karna
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


# Auto password generate karna
def generate_password(length: int = 10) -> str:
    characters = string.ascii_letters + string.digits
    return ''.join(secrets.choice(characters) for _ in range(length))


# Employee create karna (Refactored to link to CEO's company_id)
def create_employee(db: Session, data, ceo_id: int):
    ceo = db.query(User).filter(User.id == ceo_id).first()

    if not data.password or data.password.strip() == "":
        plain_password = generate_password()
    else:
        plain_password = data.password

    hashed = hash_password(plain_password)

    new_employee = User(
        full_name=data.full_name,
        email=data.email,
        password=hashed,
        phone=data.phone,
        department=data.department,
        joining_date=data.joining_date,
        role="employee",
        status="active",
        company_id=ceo.company_id if ceo else None
    )

    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    return new_employee, plain_password


# CEO ke saare employees lana (Refactored to query by company_id)
def get_employees_by_company(db: Session, company_id: int):
    return db.query(User).filter(
        User.role == "employee",
        User.company_id == company_id
    ).all()