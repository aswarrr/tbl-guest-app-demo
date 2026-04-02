import { type FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../services/auth.service";
import AuthCardHeader from "../../components/auth/AuthCardHeader";
import ErrorMessage from "../../components/ErrorMessage";
import Loader from "../../components/Loader";
import useAuth from "../../hooks/useAuth";

type Tab = "email" | "mobilePassword" | "mobileOtp";

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

export default function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [tab, setTab] = useState<Tab>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
  });

  const [mobilePasswordForm, setMobilePasswordForm] = useState({
    mobile: "",
    password: "",
  });

  const [mobileOtpForm, setMobileOtpForm] = useState({
    mobile: "",
  });

  const completeLogin = async (result: AuthTokensResponse) => {
    const { accessToken, refreshToken } = extractTokens(result);

    if (!accessToken) {
      throw new Error("Login succeeded but no access token was returned");
    }

    await setSession({
      accessToken,
      refreshToken,
    });

    navigate("/");
  };

  const handleLoginEmail = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService.loginEmail(emailForm);
      await completeLogin(result);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleLoginMobilePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authService.loginMobile(mobilePasswordForm);
      await completeLogin(result);
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.requestMobileOtp(mobileOtpForm);

      navigate("/otp-verify", {
        state: {
          mode: "loginMobileOtp",
          mobile: mobileOtpForm.mobile,
        },
      });
    } catch (error: unknown) {
      setError(getErrorMessage(error, "Failed to request OTP"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card auth-card">
        <AuthCardHeader title="Login" />

        <div className="tabs">
          <button
            type="button"
            className={`tab ${tab === "email" ? "tab-active" : ""}`}
            onClick={() => setTab("email")}
          >
            Email
          </button>

          <button
            type="button"
            className={`tab ${tab === "mobilePassword" ? "tab-active" : ""}`}
            onClick={() => setTab("mobilePassword")}
          >
            Mobile + Password
          </button>

          <button
            type="button"
            className={`tab ${tab === "mobileOtp" ? "tab-active" : ""}`}
            onClick={() => setTab("mobileOtp")}
          >
            Mobile OTP
          </button>
        </div>

        <ErrorMessage message={error} />
        {loading && <Loader text="Please wait..." />}

        {tab === "email" && (
          <form className="stack" onSubmit={handleLoginEmail}>
            <input
              className="input"
              placeholder="Email"
              type="email"
              value={emailForm.email}
              onChange={(e) =>
                setEmailForm({ ...emailForm, email: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={emailForm.password}
              onChange={(e) =>
                setEmailForm({ ...emailForm, password: e.target.value })
              }
            />
            <button className="button" type="submit" disabled={loading}>
              Login
            </button>
          </form>
        )}

        {tab === "mobilePassword" && (
          <form className="stack" onSubmit={handleLoginMobilePassword}>
            <input
              className="input"
              placeholder="Mobile"
              value={mobilePasswordForm.mobile}
              onChange={(e) =>
                setMobilePasswordForm({
                  ...mobilePasswordForm,
                  mobile: e.target.value,
                })
              }
            />
            <input
              className="input"
              placeholder="Password"
              type="password"
              value={mobilePasswordForm.password}
              onChange={(e) =>
                setMobilePasswordForm({
                  ...mobilePasswordForm,
                  password: e.target.value,
                })
              }
            />
            <button className="button" type="submit" disabled={loading}>
              Login
            </button>
          </form>
        )}

        {tab === "mobileOtp" && (
          <form className="stack" onSubmit={handleRequestOtp}>
            <input
              className="input"
              placeholder="Mobile"
              value={mobileOtpForm.mobile}
              onChange={(e) => setMobileOtpForm({ mobile: e.target.value })}
            />
            <button className="button" type="submit" disabled={loading}>
              Request OTP
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>Don&apos;t have an account?</span>
          <Link to="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
