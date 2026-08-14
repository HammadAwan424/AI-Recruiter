from typing import Annotated, Literal, Optional, Union

from pydantic import BaseModel, Field


class ApprovedExecutiveOfferDecision(BaseModel):
    decision: Literal["approved"] = "approved"
    comments: Optional[str] = None


class RejectedExecutiveOfferDecision(BaseModel):
    decision: Literal["rejected"] = "rejected"
    comments: Optional[str] = None


ExecutiveOfferDecision = Annotated[
    Union[ApprovedExecutiveOfferDecision, RejectedExecutiveOfferDecision],
    Field(discriminator="decision"),
]
__all__ = [
    "ApprovedExecutiveOfferDecision",
    "RejectedExecutiveOfferDecision",
    "ExecutiveOfferDecision",
]
