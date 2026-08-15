import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

from app.domain.enums import ApplicationDisposition, ApplicationStatus, OfferStatus
from app.services.offer_service import delete_offer_service, ensure_offer_is_internal


class FakeSession:
    def __init__(self):
        self.deleted = []
        self.committed = False

    def delete(self, model):
        self.deleted.append(model)

    def commit(self):
        self.committed = True


class OfferDeletionTests(unittest.TestCase):
    def test_deleting_offer_also_deletes_its_approval_and_restores_application(self):
        approval = SimpleNamespace(id=9)
        application = SimpleNamespace(
            current_status=ApplicationStatus.OFFER_APPROVAL,
            disposition=ApplicationDisposition.REJECTED,
            updated_by=None,
        )
        offer = SimpleNamespace(
            id=3,
            status=OfferStatus.APPROVAL_REJECTED,
            application=application,
            approval=approval,
        )
        db = FakeSession()

        with patch("app.services.offer_service.get_offer_or_403", return_value=offer):
            response = delete_offer_service(db, offer_id=offer.id, current_user={"user_id": 17})

        self.assertEqual(db.deleted, [approval, offer])
        self.assertTrue(db.committed)
        self.assertEqual(application.current_status, ApplicationStatus.INTERVIEW)
        self.assertEqual(application.disposition, ApplicationDisposition.ACTIVE)
        self.assertEqual(application.updated_by, 17)
        self.assertEqual(response["message"], "Offer #3 and associated approval deleted successfully")

    def test_sent_or_finalized_offers_cannot_be_revised_or_deleted(self):
        for offer_status in (
            OfferStatus.SENT,
            OfferStatus.SIGNED,
            OfferStatus.DECLINED,
            OfferStatus.EXPIRED,
        ):
            with self.subTest(offer_status=offer_status):
                offer = SimpleNamespace(status=offer_status)
                with self.assertRaises(HTTPException) as error:
                    ensure_offer_is_internal(offer)

                self.assertEqual(error.exception.status_code, 409)

    def test_internal_offers_remain_revisable(self):
        for offer_status in (
            OfferStatus.DRAFT,
            OfferStatus.PENDING_APPROVAL,
            OfferStatus.APPROVAL_REJECTED,
        ):
            with self.subTest(offer_status=offer_status):
                ensure_offer_is_internal(SimpleNamespace(status=offer_status))


if __name__ == "__main__":
    unittest.main()
