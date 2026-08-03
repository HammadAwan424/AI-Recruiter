import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal, Base, engine
from app.models.company import Company
from app.models.user import User
from app.models.job import Job
from app.models.rbac import Role, RolePermission, UserJobScope
from app.models.application import Application
from app.utils.security import (
    get_job_scope,
    get_scoped_jobs_query,
    get_scoped_users_query,
    get_scoped_applications_query,
    user_has_permission,
    get_job_or_403
)
from mock.run_all_mocks import reset_database


def run_tests():
    print("🧪 Running Job Scope Refactor Unit Tests...")

    # 1. Reset database tables
    reset_database()
    db = SessionLocal()

    try:
        comp = Company(name="Test Scope Company")
        db.add(comp)
        db.commit()
        db.refresh(comp)

        role_own = Role(name="hm_test", company_id=comp.id, job_scope="own")
        role_all = Role(name="ceo_test", company_id=comp.id, job_scope="all")
        db.add(role_own)
        db.add(role_all)
        db.commit()

        # Test 1: get_job_scope
        assert get_job_scope(db, "hm_test", comp.id) == "own", "Failed: hm_test should have scope 'own'"
        assert get_job_scope(db, "ceo_test", comp.id) == "all", "Failed: ceo_test should have scope 'all'"
        assert get_job_scope(db, "nonexistent", comp.id) == "own", "Failed: default scope should be 'own'"
        print("  ✓ Test 1 Passed: get_job_scope correctly resolves 'own', 'all', and defaults.")

        # Test 2: Scoped Query Filtering
        user_hm = User(full_name="HM Filter", email="hm_filter@test.com", password="pass", role="hm_test", company_id=comp.id)
        user_ceo = User(full_name="CEO Filter", email="ceo_filter@test.com", password="pass", role="ceo_test", company_id=comp.id)
        db.add(user_hm)
        db.add(user_ceo)
        db.commit()

        job1 = Job(company_id=comp.id, title="Job 1 - Unassigned")
        job2 = Job(company_id=comp.id, title="Job 2 - Assigned")
        db.add(job1)
        db.add(job2)
        db.commit()

        from app.models.candidate import Candidate
        cand1 = Candidate(full_name="Cand 1", email="cand1@test.com")
        cand2 = Candidate(full_name="Cand 2", email="cand2@test.com")
        db.add(cand1)
        db.add(cand2)
        db.commit()

        app1 = Application(job_id=job1.id, candidate_id=cand1.id, current_status="applied")
        app2 = Application(job_id=job2.id, candidate_id=cand2.id, current_status="screening")
        db.add(app1)
        db.add(app2)
        db.commit()

        # Assign user_hm to job2 only
        scope2 = UserJobScope(user_id=user_hm.id, job_id=job2.id)
        db.add(scope2)
        db.commit()

        current_user_hm = {"user_id": user_hm.id, "role": "hm_test", "company_id": comp.id}
        current_user_ceo = {"user_id": user_ceo.id, "role": "ceo_test", "company_id": comp.id}

        # HM with "own" scope sees only job2
        hm_jobs = get_scoped_jobs_query(db=db, current_user=current_user_hm).all()
        assert len(hm_jobs) == 1, f"Expected 1 job for HM, got {len(hm_jobs)}"
        assert hm_jobs[0].id == job2.id, f"Expected job2 ID {job2.id}, got {hm_jobs[0].id}"
        print("  ✓ Test 2 Passed: HM with scope 'own' sees ONLY assigned jobs.")

        # CEO with "all" scope sees both jobs
        ceo_jobs = get_scoped_jobs_query(db=db, current_user=current_user_ceo).all()
        assert len(ceo_jobs) == 2, f"Expected 2 jobs for CEO, got {len(ceo_jobs)}"
        print("  ✓ Test 3 Passed: CEO with scope 'all' sees ALL company jobs.")

        # Test 4: get_scoped_users_query
        scoped_users = get_scoped_users_query(db=db, current_user=current_user_hm).all()
        assert len(scoped_users) == 2, f"Expected 2 company users, got {len(scoped_users)}"
        print("  ✓ Test 4 Passed: get_scoped_users_query returns company-scoped users.")

        # Test 5: get_scoped_applications_query
        hm_apps = get_scoped_applications_query(db=db, current_user=current_user_hm).all()
        assert len(hm_apps) == 1, f"Expected 1 app for HM, got {len(hm_apps)}"
        assert hm_apps[0].id == app2.id, f"Expected app2 ID {app2.id}, got {hm_apps[0].id}"
        print("  ✓ Test 5 Passed: get_scoped_applications_query filters applications by job scope.")

        print("\n🎉 All Security & Job Scope Unit Tests Passed Successfully!")

    finally:
        db.close()


if __name__ == "__main__":
    run_tests()
