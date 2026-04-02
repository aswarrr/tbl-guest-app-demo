import React from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import OtpVerifyPage from "./pages/auth/OtpVerifyPage";
import InvitationValidatePage from "./pages/auth/InvitationValidatePage";
import HomePage from "./pages/app/HomePage";
import ReservationsPage from "./pages/app/ReservationsPage";
import CompaniesPage from "./pages/app/CompaniesPage";
import BranchesPage from "./pages/app/BranchesPage";
import CompleteBranchProfilePage from "./pages/app/CompleteBranchProfilePage";
import BranchProfilePage from "./pages/app/BranchProfilePage";
import Loader from "./components/Loader";
import useAuth from "./hooks/useAuth";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import { getReservationAccess } from "./utils/reservations";

function FullPageLoader({ text }: { text: string }) {
  return (
    <div className="page">
      <div className="card">
        <Loader text={text} />
      </div>
    </div>
  );
}

function ProtectedApp({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (!isAuthenticated && isBootstrapping) {
    return <FullPageLoader text="Checking session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <WorkspaceProvider>{children}</WorkspaceProvider>;
}

function AppHomeRoute() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const companyRoles = Array.isArray(user?.companyRoles) ? user.companyRoles : [];
  const branchRoles = Array.isArray(user?.branchRoles) ? user.branchRoles : [];
  const canAccessBranches = isSuperAdmin || companyRoles.length > 0 || branchRoles.length > 0;
  const reservationAccess = getReservationAccess(user);

  if (canAccessBranches) {
    return <Navigate to="/branches" replace />;
  }

  if (reservationAccess.hasAccess) {
    return <Navigate to="/reservations" replace />;
  }

  return <HomePage />;
}

function GuestOnly({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <FullPageLoader text="Checking session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function NotFoundPage() {
  return (
    <div className="page">
      <div className="card">
        <h2>404</h2>
        <p>Page not found.</p>
        <Link className="button" to="/">
          Back Home
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedApp>
            <AppHomeRoute />
          </ProtectedApp>
        }
      />

      <Route
        path="/companies"
        element={
          <ProtectedApp>
            <CompaniesPage />
          </ProtectedApp>
        }
      />

      <Route
        path="/branches"
        element={
          <ProtectedApp>
            <BranchesPage />
          </ProtectedApp>
        }
      />

      <Route
        path="/companies/:companyId/branches"
        element={
          <ProtectedApp>
            <BranchesPage />
          </ProtectedApp>
        }
      />

      <Route
        path="/branches/:branchId/profile"
        element={
          <ProtectedApp>
            <BranchProfilePage />
          </ProtectedApp>
        }
      />

      <Route
        path="/branches/:branchId/complete-profile"
        element={
          <ProtectedApp>
            <CompleteBranchProfilePage />
          </ProtectedApp>
        }
      />

      {/* Prototype modules temporarily disabled.
      <Route
        path="/staff"
        element={
          <ProtectedApp>
            <StaffPage />
          </ProtectedApp>
        }
      />

      <Route
        path="/invitations"
        element={
          <ProtectedApp>
            <InvitationsPage />
          </ProtectedApp>
        }
      />
      */}

      <Route
        path="/reservations"
        element={
          <ProtectedApp>
            <ReservationsPage />
          </ProtectedApp>
        }
      />

      {/* Prototype modules temporarily disabled.
      <Route
        path="/debug/session"
        element={
          <ProtectedApp>
            <DashboardPage />
          </ProtectedApp>
        }
      />
      */}

      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />

      <Route
        path="/signup"
        element={
          <GuestOnly>
            <SignupPage />
          </GuestOnly>
        }
      />

      <Route
        path="/otp-verify"
        element={
          <GuestOnly>
            <OtpVerifyPage />
          </GuestOnly>
        }
      />

      <Route path="/invite/:token" element={<InvitationValidatePage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
