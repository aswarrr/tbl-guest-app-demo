import { type FormEvent, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  authService,
  type SignupStartPayload,
} from "../../services/auth.service";
import AuthCardHeader from "../../components/auth/AuthCardHeader";
import ErrorMessage from "../../components/ErrorMessage";
import Loader from "../../components/Loader";
import SuccessMessage from "../../components/SuccessMessage";

export default function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const invitationTokenFromUrl =
    searchParams.get("invitationToken") ||
    searchParams.get("token") ||
    "";
  const invitationTokenFromState = location.state?.invitationToken || "";
  const initialInvitationToken = invitationTokenFromUrl || invitationTokenFromState;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    mobile: "",
    whatsapp: "",
    password: "",
    invitationToken: initialInvitationToken,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!initialInvitationToken) return;

    setForm((current) =>
      current.invitationToken === initialInvitationToken
        ? current
        : {
            ...current,
            invitationToken: initialInvitationToken,
          }
    );
  }, [initialInvitationToken]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const signupPayload: SignupStartPayload = {
        first_name: form.first_name,
        last_name: form.last_name,
        username: form.username,
        email: form.email || undefined,
        mobile: form.mobile,
        whatsapp: form.whatsapp || undefined,
        password: form.password,
        invitationToken: form.invitationToken || undefined,
      };

      await authService.signupStart(signupPayload);

      setSuccess("OTP sent successfully.");
      navigate("/otp-verify", {
        state: {
          mode: "signup",
          mobile: signupPayload.mobile,
          signupPayload,
        },
      });
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card auth-card">
        <AuthCardHeader title="Sign Up" />

        <ErrorMessage message={error} />
        <SuccessMessage message={success} />
        {loading && <Loader text="Creating signup session..." />}

        <form className="stack" onSubmit={handleSubmit}>
          <input
            className="input"
            placeholder="First name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Last name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="input"
            placeholder="Mobile"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
          />
          <input
            className="input"
            placeholder="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <input
            className="input"
            placeholder="Invitation token (optional)"
            value={form.invitationToken}
            onChange={(e) =>
              setForm({ ...form, invitationToken: e.target.value })
            }
          />

          <button className="button" type="submit" disabled={loading}>
            Sign Up
          </button>
        </form>

        <div className="auth-footer">
          <span>Already have an account?</span>
          <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}
