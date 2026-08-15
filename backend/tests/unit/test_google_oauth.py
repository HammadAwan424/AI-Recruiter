import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.company import Company
from app.models.user import User
from app.models.gmail_account import GmailAccount
from app.utils.security import hash_password, create_access_token


class GoogleOAuthRoutesTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite:///:memory:",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.TestingSessionLocal = sessionmaker(
            autocommit=False, autoflush=False, bind=self.engine
        )
        Base.metadata.create_all(bind=self.engine)

        def override_get_db():
            db = self.TestingSessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

        # Seed test company and CEO user
        db = self.TestingSessionLocal()
        self.company = Company(name="Test Acme Corp")
        db.add(self.company)
        db.flush()

        self.ceo = User(
            full_name="CEO John",
            email="ceo@testacme.com",
            password=hash_password("Password123!"),
            role="ceo",
            status="active",
            company_id=self.company.id,
        )
        db.add(self.ceo)
        db.commit()

        self.ceo_token = create_access_token({
            "user_id": self.ceo.id,
            "role": self.ceo.role,
            "company_id": self.company.id,
            "email": self.ceo.email,
        })
        self.headers = {"Authorization": f"Bearer {self.ceo_token}"}
        db.close()

    def tearDown(self):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)

    def test_login_requires_mailbox_setup_when_no_token(self):
        """Login should return requires_mailbox_setup=True when company has no active OAuth tokens."""
        response = self.client.post("/auth/login", json={
            "email": "ceo@testacme.com",
            "password": "Password123!"
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("requires_mailbox_setup"))
        self.assertEqual(data.get("user_id"), self.ceo.id)

    def test_mailbox_status_disconnected_initially(self):
        """Mailbox status should report is_connected=False before OAuth linking."""
        response = self.client.get("/auth/google/status", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertFalse(data.get("is_connected"))

    @patch("app.routes.google_oauth.create_oauth_flow")
    def test_get_google_auth_url(self, mock_create_flow):
        """Should generate authorization URL with company state payload."""
        mock_flow = MagicMock()
        mock_flow.authorization_url.return_value = ("https://accounts.google.com/o/oauth2/auth?client_id=123", "state_123")
        mock_create_flow.return_value = mock_flow

        response = self.client.get("/auth/google/url", headers=self.headers)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("auth_url", data)
        self.assertIn("state", data)
        self.assertIn("company_id", data["state"])

    @patch("app.routes.google_oauth.build")
    @patch("app.routes.google_oauth.create_oauth_flow")
    def test_oauth_exchange_links_mailbox(self, mock_create_flow, mock_build):
        """OAuth exchange should link mailbox, save token_json, and update status."""
        mock_creds = MagicMock()
        mock_creds.to_json.return_value = '{"token": "test_token", "refresh_token": "test_refresh"}'

        mock_flow = MagicMock()
        mock_flow.credentials = mock_creds
        mock_create_flow.return_value = mock_flow

        mock_oauth2 = MagicMock()
        mock_oauth2.userinfo().get().execute.return_value = {"email": "careers@testacme.com"}
        mock_build.return_value = mock_oauth2

        state_str = f'{{"company_id": {self.company.id}, "user_id": {self.ceo.id}}}'
        response = self.client.post("/auth/google/exchange", json={
            "code": "test_auth_code_123",
            "state": state_str
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("status"), "success")
        self.assertEqual(data.get("mailbox_email"), "careers@testacme.com")
        self.assertTrue(data.get("is_connected"))

        # Check that mailbox status endpoint now returns is_connected=True
        status_res = self.client.get("/auth/google/status", headers=self.headers)
        self.assertEqual(status_res.status_code, 200)
        self.assertTrue(status_res.json().get("is_connected"))
        self.assertEqual(status_res.json().get("mailbox_email"), "careers@testacme.com")

        # Check that login now returns requires_mailbox_setup=False
        login_res = self.client.post("/auth/login", json={
            "email": "ceo@testacme.com",
            "password": "Password123!"
        })
        self.assertEqual(login_res.status_code, 200)
        self.assertFalse(login_res.json().get("requires_mailbox_setup"))


if __name__ == "__main__":
    unittest.main()
