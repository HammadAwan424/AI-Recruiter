import unittest
from unittest.mock import patch

from app.main import app
from app.services.gmail.notifications import notify_candidate_offer_letter


class PublicOfferRouteTests(unittest.TestCase):
    def test_public_offer_read_and_decision_routes_are_unauthenticated(self):
        paths = app.openapi()["paths"]

        read_route = paths["/offers/public/{token}"]["get"]
        decision_route = paths["/offers/public/{token}/decisions"]["post"]

        self.assertNotIn("security", read_route)
        self.assertNotIn("security", decision_route)

    @patch("app.services.gmail.notifications.send_email_service")
    def test_candidate_offer_email_uses_frontend_public_signing_route(self, send_email):
        notify_candidate_offer_letter(
            candidate_email="candidate@example.com",
            candidate_name="Alex Candidate",
            job_title="Engineer",
            company_name="Example Co",
            secure_token="token-123",
            base_salary=100000,
            frontend_base_url="https://careers.example.com",
        )

        email_body = send_email.call_args.args[2]
        html_body = send_email.call_args.args[3]
        expected_link = "https://careers.example.com/offers/public/token-123"
        self.assertIn(expected_link, email_body)
        self.assertIn(expected_link, html_body)


if __name__ == "__main__":
    unittest.main()
