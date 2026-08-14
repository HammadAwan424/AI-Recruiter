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


class OfferApprovalAction(BaseModel):
    """Compatibility name for the privileged approval command."""

    decision: Literal["approved", "rejected"]
    comments: Optional[str] = None


__all__ = [
    "ApprovedExecutiveOfferDecision",
    "RejectedExecutiveOfferDecision",
    "ExecutiveOfferDecision",
    "OfferApprovalAction",
]
