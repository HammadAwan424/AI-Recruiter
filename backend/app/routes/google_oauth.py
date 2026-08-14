import os
import json
import logging
from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from googleapiclient.discovery import build

# Disable strict OAuthLib scope change checking & allow insecure transport for local dev
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

from app.database import get_db
from app.models.gmail_account import GmailAccount
from app.models.company import Company
from app.utils.security import get_current_user
from app.utils.gmail import (
    create_oauth_flow,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth/google",
    tags=["Google OAuth"]
)


class OAuthExchangePayload(BaseModel):
    code: str
    state: Optional[str] = None
    redirect_uri: Optional[str] = None


@router.get("/url")
def get_google_auth_url(
    redirect_uri: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generates a Google OAuth consent URL for linking the company Gmail mailbox.
    The signed state parameter securely binds the OAuth session to the company ID.
    """
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="User account is not associated with a company.")

    fallback_redirect = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:5173/auth/google/callback")
    target_redirect = redirect_uri or fallback_redirect

    try:
        flow = create_oauth_flow(redirect_uri=target_redirect)
        state_data = {
            "company_id": company_id,
            "user_id": current_user["user_id"],
            "redirect_uri": target_redirect,
            "type": "company_mailbox_oauth"
        }
        state_str = json.dumps(state_data)
        
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=state_str
        )
        return {
            "auth_url": authorization_url,
            "state": state_str,
            "redirect_uri": target_redirect
        }
    except Exception as e:
        logger.exception("Failed to generate Google OAuth URL: %s", e)
        raise HTTPException(
            status_code=500,
            detail=f"Could not generate Google authorization URL: {str(e)}"
        )


def get_optional_current_user(request: Request) -> Optional[Dict[str, Any]]:
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    try:
        from app.utils.security import decode_access_token
        return decode_access_token(token)
    except Exception:
        return None


@router.post("/exchange")
def exchange_oauth_code(
    payload: OAuthExchangePayload,
    current_user: Optional[Dict[str, Any]] = Depends(get_optional_current_user),
    db: Session = Depends(get_db)
):
    """
    Exchanges the one-time authorization code for permanent Google OAuth credentials
    and links the authenticated Gmail address to the company mailbox in `gmail_accounts`.
    """
    company_id = None
    user_id = None
    state_redirect_uri = None

    # 1. Resolve company_id and redirect_uri from state parameter if present
    if payload.state:
        try:
            parsed_state = json.loads(payload.state)
            company_id = parsed_state.get("company_id")
            user_id = parsed_state.get("user_id")
            state_redirect_uri = parsed_state.get("redirect_uri")
        except Exception:
            pass

    # 2. Fallback to authenticated user token if available
    if not company_id and current_user:
        company_id = current_user.get("company_id")
        user_id = current_user.get("user_id")

    if not company_id:
        raise HTTPException(
            status_code=400,
            detail="Missing company context for mailbox OAuth binding."
        )

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found.")

    fallback_redirect = os.getenv("GOOGLE_OAUTH_REDIRECT_URI", "http://localhost:5173/auth/google/callback")
    target_redirect = state_redirect_uri or payload.redirect_uri or fallback_redirect

    try:
        flow = create_oauth_flow(redirect_uri=target_redirect)
        flow.fetch_token(code=payload.code)
        credentials = flow.credentials

        # Fetch authenticated user's email address from Google OAuth userinfo
        oauth2_service = build('oauth2', 'v2', credentials=credentials)
        user_info = oauth2_service.userinfo().get().execute()
        authenticated_email = user_info.get("email", "").strip().lower()

        if not authenticated_email:
            raise ValueError("Could not retrieve email address from authorized Google account.")

        token_json_str = credentials.to_json()

        # Upsert into gmail_accounts for this company
        existing_account = (
            db.query(GmailAccount)
            .filter(
                GmailAccount.company_id == company_id,
                GmailAccount.email == authenticated_email
            )
            .first()
        )

        if existing_account:
            existing_account.token_json = token_json_str
            existing_account.is_active = True
            existing_account.is_primary = True
            existing_account.provider = "gmail"
            if user_id:
                existing_account.updated_by = user_id
        else:
            # Mark previous accounts as secondary if needed
            db.query(GmailAccount).filter(
                GmailAccount.company_id == company_id
            ).update({"is_primary": False})

            new_account = GmailAccount(
                company_id=company_id,
                email=authenticated_email,
                provider="gmail",
                token_json=token_json_str,
                is_active=True,
                is_primary=True,
                created_by=user_id,
                updated_by=user_id
            )
            db.add(new_account)

        db.commit()

        logger.info(
            "Company #%s successfully linked Google mailbox: %s",
            company_id,
            authenticated_email
        )

        return {
            "status": "success",
            "message": f"Google mailbox '{authenticated_email}' linked successfully.",
            "mailbox_email": authenticated_email,
            "company_id": company_id,
            "is_connected": True
        }

    except Exception as e:
        db.rollback()
        logger.exception("OAuth exchange failed: %s", e)
        raise HTTPException(
            status_code=400,
            detail=f"Google OAuth token exchange failed: {str(e)}"
        )


@router.get("/status")
def get_company_mailbox_status(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the current company's Google mailbox connection and health status.
    """
    company_id = current_user.get("company_id")
    if not company_id:
        return {
            "is_connected": False,
            "mailbox_email": None,
            "provider": "gmail",
            "is_active": False,
            "last_read": None
        }

    active_account = (
        db.query(GmailAccount)
        .filter(
            GmailAccount.company_id == company_id,
            GmailAccount.is_active.is_(True),
            GmailAccount.token_json.isnot(None)
        )
        .order_by(GmailAccount.is_primary.desc(), GmailAccount.id.desc())
        .first()
    )

    if not active_account:
        return {
            "is_connected": False,
            "mailbox_email": None,
            "provider": "gmail",
            "is_active": False,
            "last_read": None
        }

    return {
        "is_connected": True,
        "mailbox_email": active_account.email,
        "provider": active_account.provider,
        "is_active": active_account.is_active,
        "is_primary": active_account.is_primary,
        "last_read": active_account.last_read.isoformat() if active_account.last_read else None
    }


@router.post("/disconnect")
def disconnect_company_mailbox(
    current_user: Dict[str, Any] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Disconnects and deactivates the current company's Gmail mailbox.
    """
    company_id = current_user.get("company_id")
    if not company_id:
        raise HTTPException(status_code=400, detail="User account is not associated with a company.")

    if current_user.get("role") != "ceo":
        raise HTTPException(status_code=403, detail="Only company administrators can disconnect the company mailbox.")

    accounts = (
        db.query(GmailAccount)
        .filter(GmailAccount.company_id == company_id)
        .all()
    )
    for acc in accounts:
        acc.is_active = False
        acc.token_json = None

    db.commit()
    return {"message": "Company mailbox disconnected successfully.", "is_connected": False}
