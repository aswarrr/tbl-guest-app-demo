import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import {
  authService,
  type SignupStartPayload,
} from "../../services/auth.service";
import AuthCardHeader from "../../components/auth/AuthCardHeader";
import ErrorMessage from "../../components/ErrorMessage";
import Loader from "../../components/Loader";
import SuccessMessage from "../../components/SuccessMessage";
import WarningMessage from "../../components/WarningMessage";
import useAuth from "../../hooks/useAuth";

const RESEND_DELAY_SECONDS = 10;

type OtpVerifyLocationState = {
  mode?: "signup" | "loginMobileOtp";
  mobile?: string;
  signupPayload?: SignupStartPayload;
};

type AuthTokensResponse = {
  data?: {
    accessToken?: string | null;
    refreshToken?: string | null;
  };
  accessToken?: string | null;
  refreshToken?: string | null;
};

function extractTokens(result: AuthTokensResponse) {
  const accessToken =
    result?.data?.accessToken ??
    result?.accessToken ??
    null;

  const refreshToken =
    result?.data?.refreshToken ??
    result?.refreshToken ??
    null;

  return { accessToken, refreshToken };
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function OtpVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const locationState = (location.state ?? {}) as OtpVerifyLocationState;

  const mode = locationState.mode;
  const initialMobile = locationState.mobile || "";
  const signupPayload = locationState.signupPayload;
  const showResendSection = mode === "signup" || mode === "loginMobileOtp";
  const canResendFromState =
    mode === "loginMobileOtp" || (mode === "signup" && Boolean(signupPayload));

  const [mobile, setMobile] = useState(initialMobile);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(() =>
    canResendFromState ? RESEND_DELAY_SECONDS : 0,
  );

  const title = useMemo(() => {
    if (mode === "signup") return "Verify Signup OTP";
    if (mode === "loginMobileOtp") return "Verify Login OTP";
    return "Verify OTP";
  }, [mode]);

  const canResend =
    canResendFromState && mobile.trim().length > 0 && !loading && !resendLoading;

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setResendCooldown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [resendCooldown]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setLoading(true);

    try {
      let result: AuthTokensResponse;

      if (mode === "signup") {
        result = await authService.signupVerify({ mobile, otp });
      } else {
        result = await authService.verifyMobileOtp({ mobile, otp });
      }

      const { accessToken, refreshToken } = extractTokens(result);

      if (!accessToken) {
        throw new Error("Verification succeeded but no access token was returned");
      }

      await setSession({
        accessToken,
        refreshToken,
      });

      navigate("/");
    } catch (error: unknown) {
      setError(getErrorMessage(error, "OTP verification failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resendCooldown > 0) return;

    setSuccess("");
    setError("");
    setResendLoading(true);

    try {
      if (mode === "signup") {
        if (!signupPayload) {
          throw new Error("Please restart signup to resend the OTP");
        }

        await authService.signupStart({
          ...signupPayload,
          mobile,
        });
      } else if (mode === "loginMobileOtp") {
        await authService.requestMobileOtp({ mobile });
      } else {
        throw new Error("Please request a new OTP from login or signup");
      }

      setSuccess("OTP resent successfully.");
      setResendCooldown(RESEND_DELAY_SECONDS);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to resend OTP"));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card auth-card">
        <AuthCardHeader title={title} />

        <WarningMessage
          message={
            !mode
              ? "This page works best after requesting an OTP from login or signup."
              : undefined
          }
        />

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />
        {loading && <Loader text="Verifying..." />}

        <form className="stack" onSubmit={handleSubmit}>
          <input
            className="input"
            placeholder="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
          />
          <input
            className="input"
            placeholder="OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button className="button" type="submit" disabled={loading}>
            Verify OTP
          </button>
        </form>

        {showResendSection && (
          <div className="otp-resend-panel">
            <p className="otp-resend-copy">
              {resendCooldown > 0
                ? `You can resend the OTP in ${resendCooldown} seconds.`
                : "Didn't receive the OTP?"}
            </p>

            <button
              className="button button-secondary otp-resend-button"
              type="button"
              onClick={handleResendOtp}
              disabled={!canResend || resendCooldown > 0}
            >
              {resendLoading ? "Resending..." : "Resend OTP"}
            </button>

            {mode === "signup" && !signupPayload && (
              <p className="otp-resend-hint">
                Restart signup if you need to request a fresh OTP.
              </p>
            )}
          </div>
        )}

        <div className="auth-footer">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
