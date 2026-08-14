import unittest
from datetime import date, timedelta

from pydantic import TypeAdapter, ValidationError

from app.domain.enums import OfferStatus, SignatureType
from app.schemas.offer import OfferCreate, OfferUpdate
from app.schemas.offer_approval import ExecutiveOfferDecision
from app.schemas.offer_public import CandidateOfferDecision


class OfferContractTests(unittest.TestCase):
    def test_approval_contract_accepts_only_privileged_decisions(self):
        approved = TypeAdapter(ExecutiveOfferDecision).validate_python(
            {"decision": "approved", "comments": "Approved by CEO"}
        )
        rejected = TypeAdapter(ExecutiveOfferDecision).validate_python(
            {"decision": "rejected", "comments": "Compensation needs revision"}
        )

        self.assertEqual(approved.decision, "approved")
        self.assertEqual(rejected.decision, "rejected")

    def test_public_contract_is_separate_from_approval_contract(self):
        signed = TypeAdapter(CandidateOfferDecision).validate_python(
            {
                "decision": "signed",
                "signer_name": "Alex Candidate",
                "signature_type": "TYPED",
                "signature_data": "Alex Candidate",
            }
        )
        declined = TypeAdapter(CandidateOfferDecision).validate_python(
            {"decision": "declined", "decline_reason": "Accepted another offer"}
        )

        self.assertEqual(signed.signature_type, SignatureType.TYPED)
        self.assertEqual(declined.decision, "declined")

    def test_offer_dates_and_money_are_validated(self):
        with self.assertRaises(ValidationError):
            OfferCreate(
                application_id=1,
                base_salary=-1,
                start_date=date.today(),
                offer_letter_text="Offer",
            )

        with self.assertRaises(ValidationError):
            OfferCreate(
                application_id=1,
                base_salary=100,
                start_date=date.today(),
                expiry_date=date.today(),
                offer_letter_text="Offer",
            )

        valid = OfferCreate(
            application_id=1,
            base_salary=100,
            start_date=date.today(),
            expiry_date=date.today() + timedelta(days=7),
            offer_letter_text="Offer",
        )
        self.assertEqual(valid.base_salary, 100)

    def test_offer_update_does_not_accept_a_client_audit_field(self):
        payload = OfferUpdate(base_salary=120)
        self.assertNotIn("updated_by", payload.model_dump())

    def test_status_values_keep_approval_rejection_distinct_from_candidate_decline(self):
        self.assertNotEqual(OfferStatus.APPROVAL_REJECTED, OfferStatus.DECLINED)


if __name__ == "__main__":
    unittest.main()
