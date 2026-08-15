import unittest

from app.domain.enums import ApplicationStatus
from app.utils.security import get_disposition_permission


class CandidateDispositionPermissionTests(unittest.TestCase):
    def test_permission_follows_backend_current_status(self):
        self.assertEqual(get_disposition_permission("applied"), "candidate:disposition")
        self.assertEqual(get_disposition_permission("screening"), "candidate:disposition")
        self.assertEqual(get_disposition_permission("interview"), "candidate:disposition")
        self.assertIsNone(get_disposition_permission("offer_approval"))
        self.assertIsNone(get_disposition_permission("offer_sent"))
        self.assertIsNone(get_disposition_permission("hired"))
        self.assertEqual(get_disposition_permission(ApplicationStatus.INTERVIEW), "candidate:disposition")


if __name__ == "__main__":
    unittest.main()
