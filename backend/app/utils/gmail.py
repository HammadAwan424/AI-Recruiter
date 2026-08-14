import os
import json
import logging
from typing import Optional, Dict, Any
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow, Flow
from googleapiclient.discovery import build

# Relax OAuthLib scope checking for Google OAuth (Google often appends openid / profile to granted scopes)
os.environ["OAUTHLIB_RELAX_TOKEN_SCOPE"] = "1"
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

logger = logging.getLogger(__name__)

SCOPES = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
]


def get_oauth_credentials_dict() -> Dict[str, Any]:
    """
    Loads Google OAuth Client credentials dictionary from environment variable or credentials.json.
    Normalizes 'installed' desktop client configs to standard 'web' format for Flow.
    """
    credentials_env = os.getenv("GOOGLE_CREDENTIALS_JSON")
    credentials_path = os.path.join(os.path.dirname(__file__), "..", "credentials.json")

    raw_dict: Optional[Dict[str, Any]] = None

    if credentials_env:
        try:
            raw_dict = json.loads(credentials_env)
        except Exception as e:
            logger.warning(f"Could not parse GOOGLE_CREDENTIALS_JSON: {e}")

    if not raw_dict and os.path.exists(credentials_path):
        try:
            with open(credentials_path, "r") as f:
                raw_dict = json.load(f)
        except Exception as e:
            logger.warning(f"Could not read {credentials_path}: {e}")

    if raw_dict:
        if "installed" in raw_dict and "web" not in raw_dict:
            installed_data = raw_dict["installed"]
            return {
                "web": {
                    "client_id": installed_data.get("client_id"),
                    "client_secret": installed_data.get("client_secret"),
                    "auth_uri": installed_data.get("auth_uri", "https://accounts.google.com/o/oauth2/auth"),
                    "token_uri": installed_data.get("token_uri", "https://oauth2.googleapis.com/token"),
                    "auth_provider_x509_cert_url": installed_data.get("auth_provider_x509_cert_url", "https://www.googleapis.com/oauth2/v1/certs"),
                }
            }
        return raw_dict

    # Fallback configuration for OAuth flow initialization
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    if client_id and client_secret:
        return {
            "web": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        }

    raise FileNotFoundError(
        "Google OAuth credentials not configured! Provide GOOGLE_CREDENTIALS_JSON env var or credentials.json."
    )


def create_oauth_flow(redirect_uri: str, autogenerate_code_verifier: bool = False, **kwargs) -> Flow:
    """
    Creates a Google OAuth2 web flow configured with standard application scopes and redirect URI.
    Disables autogenerate_code_verifier by default to prevent PKCE state mismatch across
    stateless HTTP requests.
    """
    creds_dict = get_oauth_credentials_dict()
    flow = Flow.from_client_config(
        creds_dict,
        scopes=SCOPES,
        redirect_uri=redirect_uri,
        autogenerate_code_verifier=autogenerate_code_verifier,
        **kwargs
    )
    return flow


def get_gmail_service(company_id: Optional[int] = None, db: Optional[Any] = None):
    """
    Initializes and returns an authenticated Gmail API client service.
    
    Priority:
    1. Per-Company DB Credentials: If company_id & db are provided, loads the company's active
       OAuth tokens from `gmail_accounts.token_json` and auto-refreshes if expired.
    2. Environment Variable: GOOGLE_TOKEN_JSON (for Vercel / serverless deployments).
    3. Local File System: backend/app/token.json (for local development & test compatibility).
    """
    creds = None

    # 1. Company-Specific DB Token loading
    if company_id and db:
        try:
            from app.models.gmail_account import GmailAccount
            gmail_acc = (
                db.query(GmailAccount)
                .filter(
                    GmailAccount.company_id == company_id,
                    GmailAccount.is_active.is_(True),
                    GmailAccount.token_json.isnot(None)
                )
                .order_by(GmailAccount.is_primary.desc(), GmailAccount.id.desc())
                .first()
            )
            if gmail_acc and gmail_acc.token_json:
                token_info = json.loads(gmail_acc.token_json)
                creds = Credentials.from_authorized_user_info(token_info, SCOPES)
                if not creds.valid and creds.expired and creds.refresh_token:
                    creds.refresh(Request())
                    gmail_acc.token_json = creds.to_json()
                    db.commit()
                return build('gmail', 'v1', credentials=creds)
        except Exception as e:
            logger.warning(f"Could not initialize Gmail service from company #{company_id} DB token: {e}")

    token_env = os.getenv("GOOGLE_TOKEN_JSON")
    credentials_env = os.getenv("GOOGLE_CREDENTIALS_JSON")

    token_path = os.path.join(os.path.dirname(__file__), "..", "token.json")
    credentials_path = os.path.join(os.path.dirname(__file__), "..", "credentials.json")

    # 2. Attempt token loading from Environment Variable (Vercel/Serverless priority)
    if token_env:
        try:
            token_info = json.loads(token_env)
            creds = Credentials.from_authorized_user_info(token_info, SCOPES)
        except Exception as e:
            logger.warning(f"Could not load credentials from GOOGLE_TOKEN_JSON env: {e}")

    # 3. Attempt token loading from local token.json file
    if not creds and os.path.exists(token_path):
        try:
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        except Exception as e:
            logger.warning(f"Could not load credentials from {token_path}: {e}")

    # 4. Refresh token if expired or run authorization flow
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if credentials_env:
                try:
                    creds_info = json.loads(credentials_env)
                    flow = InstalledAppFlow.from_client_config(creds_info, SCOPES)
                    creds = flow.run_local_server(port=0)
                except Exception as e:
                    raise RuntimeError(f"Failed to initialize OAuth flow from GOOGLE_CREDENTIALS_JSON: {e}")
            elif os.path.exists(credentials_path):
                flow = InstalledAppFlow.from_client_secrets_file(credentials_path, SCOPES)
                creds = flow.run_local_server(port=0)
            else:
                raise FileNotFoundError(
                    "Google Credentials not found! Provide GOOGLE_CREDENTIALS_JSON environment variable or place credentials.json in backend/app/."
                )

        # Attempt saving refreshed token to local disk (safely ignored in read-only serverless environments)
        try:
            with open(token_path, 'w') as token:
                token.write(creds.to_json())
        except (IOError, OSError) as write_err:
            logger.info(f"Could not save refreshed token to disk (expected in serverless/Vercel environments): {write_err}")

    return build('gmail', 'v1', credentials=creds)
