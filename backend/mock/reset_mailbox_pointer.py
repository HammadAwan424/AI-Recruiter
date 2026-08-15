import sys
import os
import argparse
from dotenv import load_dotenv

# Ensure backend root is in PYTHONPATH and .env is loaded
backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, backend_root)
load_dotenv(os.path.join(backend_root, ".env"))

from sqlalchemy import func
from app.database import SessionLocal
from app.models.gmail_account import GmailAccount
from app.models.company import Company
from app.models.application import Application


def inspect_and_reset_mailbox_pointers(clear_ingested_apps: bool = False):
    """
    High-performance script to inspect all company mailbox pointers (last_read)
    and reset them to NULL (None) in 1-2 batched queries with ZERO N+1 overhead.
    Optimized for remote production databases over slow/latent connections.
    """
    db = SessionLocal()
    try:
        # 1. Single batched query to fetch all mailboxes, company names, and ingested counts
        results = (
            db.query(
                GmailAccount.id,
                GmailAccount.email,
                GmailAccount.last_read,
                GmailAccount.is_active,
                GmailAccount.is_primary,
                Company.id.label("company_id"),
                Company.name.label("company_name"),
                func.count(Application.id).label("ingested_count"),
            )
            .outerjoin(Company, Company.id == GmailAccount.company_id)
            .outerjoin(
                Application,
                (Application.gmail_account_id == GmailAccount.id)
                & (Application.gmail_message_id.isnot(None)),
            )
            .group_by(GmailAccount.id, Company.id, Company.name)
            .all()
        )

        if not results:
            print("❌ No Gmail accounts found in database.")
            return

        print("\n" + "=" * 65)
        print("🔍 CURRENT COMPANY MAILBOX POINTERS (BATCH INSPECTION)")
        print("=" * 65)
        for r in results:
            company_name = r.company_name or f"Company #{r.company_id}"
            print(f"• Account #{r.id} | Company: '{company_name}' (ID: {r.company_id})")
            print(f"  Email: {r.email}")
            print(f"  Current last_read pointer: {r.last_read} (UTC)")
            print(f"  Ingested Gmail Applications in DB: {r.ingested_count}")
            print(f"  Is Active: {r.is_active} | Is Primary: {r.is_primary}")
            print("-" * 65)

        # 2. Single batched DELETE query if --clear-apps is requested
        if clear_ingested_apps:
            deleted_count = (
                db.query(Application)
                .filter(Application.gmail_message_id.isnot(None))
                .delete(synchronize_session=False)
            )
            print(f"\n🗑️  Cleared {deleted_count} previously ingested application(s) from database in 1 query.")

        # 3. Single batched UPDATE query to reset all pointers to NULL (0 roundtrips per row)
        db.query(GmailAccount).update(
            {GmailAccount.last_read: None}, synchronize_session=False
        )

        # 4. Commit all updates in 1 network transaction
        db.commit()

        print("\n" + "=" * 65)
        print("✅ ALL MAILBOX POINTERS SUCCESSFULLY RESET TO NULL")
        print("=" * 65)
        for r in results:
            print(f"• Account #{r.id} ({r.email}) -> last_read: None")
        print("=" * 65 + "\n")

    except Exception as e:
        db.rollback()
        print(f"❌ Error resetting mailbox pointers: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Inspect and reset Gmail mailbox pointers (last_read) to NULL (Batched, Zero N+1 Queries)."
    )
    parser.add_argument(
        "--clear-apps",
        action="store_true",
        help="Also remove previously ingested applications (gmail_message_id is not NULL) to allow clean re-ingestion.",
    )
    args = parser.parse_args()

    inspect_and_reset_mailbox_pointers(clear_ingested_apps=args.clear_apps)
