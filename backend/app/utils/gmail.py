import os
import json
import logging
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

logger = logging.getLogger(__name__)

SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
]


def get_gmail_service():
    """
    Initializes and returns an authenticated Gmail API client service.
    Supports reading credentials & tokens from:
    1. Environment variables: GOOGLE_TOKEN_JSON & GOOGLE_CREDENTIALS_JSON (for Vercel / serverless deployments)
    2. Local file system: backend/app/token.json & backend/app/credentials.json (for local development)
    """
    creds = None
    token_env = os.getenv("GOOGLE_TOKEN_JSON")
    credentials_env = os.getenv("GOOGLE_CREDENTIALS_JSON")

    token_path = os.path.join(os.path.dirname(__file__), "..", "token.json")
    credentials_path = os.path.join(os.path.dirname(__file__), "..", "credentials.json")

    # 1. Attempt token loading from Environment Variable (Vercel/Serverless priority)
    if token_env:
        try:
            token_info = json.loads(token_env)
            creds = Credentials.from_authorized_user_info(token_info, SCOPES)
        except Exception as e:
            logger.warning(f"Could not load credentials from GOOGLE_TOKEN_JSON env: {e}")

    # 2. Attempt token loading from local token.json file
    if not creds and os.path.exists(token_path):
        try:
            creds = Credentials.from_authorized_user_file(token_path, SCOPES)
        except Exception as e:
            logger.warning(f"Could not load credentials from {token_path}: {e}")

    # 3. Refresh token if expired or run authorization flow
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
