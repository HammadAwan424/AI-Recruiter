from pydantic import BaseModel

from app.models.candidate import Candidate


class CandidateSummary(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str | None

    @classmethod
    def from_candidate(cls, c: Candidate) -> "CandidateSummary":
        return cls(id=c.id, full_name=c.full_name, email=c.email, phone=c.phone or None)