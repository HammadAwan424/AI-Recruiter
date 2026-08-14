from pydantic import BaseModel, ConfigDict


class StrictSchema(BaseModel):
    """Strict schema used at application producer/consumer boundaries."""

    model_config = ConfigDict(extra="forbid")
