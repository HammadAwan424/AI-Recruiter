from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.database import get_db
from app.models.application import Application, ApplicationComment
from app.schemas.application import CommentCreate, CommentResponse
from app.utils.security import get_current_user, get_application_or_403

router = APIRouter()


# ─────────────────────────────────────────────────────────────
# 1. LIST COMMENTS FOR AN APPLICATION
# ─────────────────────────────────────────────────────────────
@router.get("", response_model=List[CommentResponse])
def list_application_comments(
    job_id: int,
    application_id: int,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db)
):
    comments = (
        db.query(ApplicationComment)
        .options(joinedload(ApplicationComment.author))
        .filter(ApplicationComment.application_id == app.id)
        .order_by(ApplicationComment.created_at.asc())
        .all()
    )

    results = []
    for c in comments:
        results.append(
            CommentResponse(
                id=c.id,
                application_id=c.application_id,
                author_id=c.author_id,
                author_name=c.author.full_name if c.author else "Unknown",
                content=c.content,
                created_at=c.created_at
            )
        )
    return results


# ─────────────────────────────────────────────────────────────
# 2. ADD A COMMENT TO AN APPLICATION
# ─────────────────────────────────────────────────────────────
@router.post("", response_model=CommentResponse)
def add_application_comment(
    job_id: int,
    application_id: int,
    payload: CommentCreate,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    comment = ApplicationComment(
        application_id=application_id,
        author_id=current_user["user_id"],
        content=payload.content
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    return CommentResponse(
        id=comment.id,
        application_id=comment.application_id,
        author_id=comment.author_id,
        author_name=comment.author.full_name if comment.author else "Current User",
        content=comment.content,
        created_at=comment.created_at
    )


# ─────────────────────────────────────────────────────────────
# 3. DELETE A COMMENT
# ─────────────────────────────────────────────────────────────
@router.delete("/{comment_id}")
def delete_application_comment(
    job_id: int,
    application_id: int,
    comment_id: int,
    app: Application = Depends(get_application_or_403),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    comment = db.query(ApplicationComment).filter(
        ApplicationComment.id == comment_id,
        ApplicationComment.application_id == app.id
    ).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user["user_id"] and current_user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully."}
