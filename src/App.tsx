import React from "react";
import { Routes, Route, Navigate, Link, useParams } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import OtpVerifyPage from "./pages/auth/OtpVerifyPage";
import ReservationsPage from "./pages/app/ReservationsPage";
import BranchesPage from "./pages/app/BranchesPage";
import BranchProfilePage from "./pages/app/BranchProfilePage";
import Loader from "./components/Loader";
import useAuth from "./hooks/useAuth";

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

  return children;
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
        <Link className="button" to="/restaurants">
          Browse Restaurants
        </Link>
      </div>
    </div>
  );
}

function InvitationSignupRedirect() {
  const { token = "" } = useParams();
  const target = token
    ? `/signup?invitationToken=${encodeURIComponent(token)}`
    : "/signup";

  return <Navigate to={target} replace />;
}

function LegacyBranchProfileRedirect() {
  const { branchId = "" } = useParams();
  const target = branchId ? `/restaurants/${branchId}` : "/restaurants";

  return <Navigate to={target} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedApp>
            <Navigate to="/restaurants" replace />
          </ProtectedApp>
        }
      />

      <Route
        path="/restaurants"
        element={
          <ProtectedApp>
            <BranchesPage />
          </ProtectedApp>
        }
      />

      <Route
        path="/branches"
        element={
          <ProtectedApp>
            <Navigate to="/restaurants" replace />
          </ProtectedApp>
        }
      />

      <Route
        path="/companies/:companyId/branches"
        element={
          <ProtectedApp>
            <Navigate to="/restaurants" replace />
          </ProtectedApp>
        }
      />

      <Route
        path="/restaurants/:branchId"
        element={
          <ProtectedApp>
            <BranchProfilePage />
          </ProtectedApp>
        }
      />

      <Route
        path="/branches/:branchId/profile"
        element={
          <ProtectedApp>
            <LegacyBranchProfileRedirect />
          </ProtectedApp>
        }
      />

      <Route
        path="/companies"
        element={
          <ProtectedApp>
            <Navigate to="/restaurants" replace />
          </ProtectedApp>
        }
      />

      <Route
        path="/reservations"
        element={
          <ProtectedApp>
            <ReservationsPage />
          </ProtectedApp>
        }
      />

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

      <Route path="/invite/:token" element={<InvitationSignupRedirect />} />
      <Route path="/home" element={<Navigate to="/restaurants" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
