from pydantic import BaseModel, ConfigDict, EmailStr


class CandidateSummary(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone: str | None = None

    @classmethod
    def from_candidate(cls, c) -> "CandidateSummary":
        return cls(id=c.id, full_name=c.full_name, email=c.email, phone=c.phone or None)

    model_config = ConfigDict(from_attributes=True)
