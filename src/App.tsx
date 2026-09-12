import WebsiteProvider from "./website/WebsiteProvider";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import OtpVerifyPage from "./pages/auth/OtpVerifyPage";
import { TenantProvider } from "./context/TenantProvider";
import SiteLayout from "./components/site/SiteLayout";
import SiteErrorBoundary from "./components/site/SiteErrorBoundary";
import DirectoryPage from "./pages/DirectoryPage";
import HomePage from "./pages/site/HomePage";
import MenuPage from "./pages/site/MenuPage";
import AboutPage from "./pages/site/AboutPage";
import LocationsPage from "./pages/site/LocationsPage";
import PoliciesPage from "./pages/site/PoliciesPage";
import ReservePage from "./pages/site/ReservePage";
import ConfirmationPage from "./pages/site/ConfirmationPage";

export default function App() {
  return (
    <SiteErrorBoundary>
      <Routes>
        {/* The host root lists the restaurants that have a public site. */}
        <Route path="/" element={<DirectoryPage />} />

        {/*
         * Every guest route is scoped to a restaurant. TenantProvider sits
         * inside the route so it can read :companySlug.
         */}
        <Route
          path=":companySlug"
          element={
            <TenantProvider>
              <WebsiteProvider><SiteLayout /></WebsiteProvider>
            </TenantProvider>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="menu" element={<MenuPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="locations" element={<LocationsPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="reserve" element={<ReservePage />} />
          <Route path="auth/login" element={<LoginPage />} />
          <Route path="auth/signup" element={<SignupPage />} />
          <Route path="auth/verify" element={<OtpVerifyPage />} />
          <Route
            path="reservation/:reservationId/confirmation"
            element={<ConfirmationPage />}
          />
          <Route path="login" element={<Navigate to="../auth/login" replace />} />
          <Route path="signup" element={<Navigate to="../auth/signup" replace />} />
          <Route path="otp-verify" element={<Navigate to="../auth/verify" replace />} />
          <Route path="restaurants/*" element={<Navigate to="../locations" replace />} />
          <Route path="reservations" element={<Navigate to="../reserve" replace />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SiteErrorBoundary>
  );
}
