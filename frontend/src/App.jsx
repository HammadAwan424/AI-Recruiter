import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AppLayout } from "./app/layout/AppLayout";
import { JobPortalPage } from "./features/jobs/screens/JobPortalPage";
import { CandidateOfferSignPage } from "./features/offers/screens/CandidateOfferSignPage";
import { CandidateSelfSchedulePage } from "./features/interviews/screens/CandidateSelfSchedulePage";

import { LoginPage } from "./features/auth/screens/LoginPage";
import { SignupPage } from "./features/auth/screens/SignupPage";
import { DashboardOverviewPage } from "./features/dashboard/screens/DashboardOverviewPage";
import { SuperAdminOverviewPage } from "./features/superadmin/screens/SuperAdminOverviewPage";
import { CompanyManagementPage } from "./features/superadmin/screens/CompanyManagementPage";
import { UserManagementPage } from "./features/users/screens/UserManagementPage";
import { JobManagementPage } from "./features/jobs/screens/JobManagementPage";
import { CandidatePipelinePage } from "./features/candidates/screens/CandidatePipelinePage";
import { InterviewManagementPage } from "./features/interviews/screens/InterviewManagementPage";
import { OfferManagementPage } from "./features/offers/screens/OfferManagementPage";
import { SettingsPage } from "./features/settings/screens/SettingsPage";

import { RequirePermission } from "./shared/guards/RequirePermission";
import { USER_PERMISSIONS } from "./features/users/permissions";
import { JOB_PERMISSIONS } from "./features/jobs/permissions";
import { CANDIDATE_PERMISSIONS } from "./features/candidates/permissions";
import { INTERVIEW_PERMISSIONS } from "./features/interviews/permissions";
import { OFFER_PERMISSIONS } from "./features/offers/permissions";

// Protected Route Guard
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Feature Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Public Portal & Signature Routes */}
        <Route path="/jobs/portal" element={<JobPortalPage />} />
        <Route path="/offer/sign/:token" element={<CandidateOfferSignPage />} />
        <Route path="/interview/schedule/:token" element={<CandidateSelfSchedulePage />} />

        {/* Main Application Layout Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/ceo/dashboard" element={<DashboardOverviewPage />} />
          <Route path="/employee/dashboard" element={<DashboardOverviewPage />} />
          <Route path="/admin/dashboard" element={<SuperAdminOverviewPage />} />
          <Route path="/admin/companies" element={<CompanyManagementPage />} />

          <Route
            path="/ceo/users"
            element={
              <RequirePermission permission={USER_PERMISSIONS.CHANGE_PERMISSIONS}>
                <UserManagementPage />
              </RequirePermission>
            }
          />
          <Route
            path="/jobs"
            element={
              <RequirePermission permission={JOB_PERMISSIONS.CREATE_REQUISITION}>
                <JobManagementPage />
              </RequirePermission>
            }
          />
          <Route
            path="/candidates"
            element={
              <RequirePermission permission={CANDIDATE_PERMISSIONS.DISPOSITION_CANDIDATE}>
                <CandidatePipelinePage />
              </RequirePermission>
            }
          />
          <Route
            path="/interviews"
            element={
              <RequirePermission permission={INTERVIEW_PERMISSIONS.CREATE_INTERVIEW}>
                <InterviewManagementPage />
              </RequirePermission>
            }
          />
          <Route
            path="/offers"
            element={
              <RequirePermission permission={OFFER_PERMISSIONS.CREATE_OFFER}>
                <OfferManagementPage />
              </RequirePermission>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
