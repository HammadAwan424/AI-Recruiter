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
import { GoogleCallbackPage } from "./features/auth/screens/GoogleCallbackPage";
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

import { useAuth } from "./shared/context/AuthContext";

// Protected Route Guard
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const token = localStorage.getItem("token");
  if (!isAuthenticated || !token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Feature Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

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
          <Route path="/admin" element={<CompanyManagementPage />} />
          <Route path="/admin/companies" element={<CompanyManagementPage />} />

          <Route
            path="/users"
            element={
              <RequirePermission permission="user:">
                <UserManagementPage />
              </RequirePermission>
            }
          />
          <Route
            path="/jobs"
            element={
              <RequirePermission permission="job:">
                <JobManagementPage />
              </RequirePermission>
            }
          />
          <Route
            path="/candidates"
            element={
              <RequirePermission permission="candidate:">
                <CandidatePipelinePage />
              </RequirePermission>
            }
          />
          <Route
            path="/interviews"
            element={
              <RequirePermission permission="interview:">
                <InterviewManagementPage />
              </RequirePermission>
            }
          />
          <Route
            path="/offers"
            element={
              <RequirePermission permission="offer:">
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
