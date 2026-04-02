import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { invitationsService } from "../../services/invitations.service";
import AuthCardHeader from "../../components/auth/AuthCardHeader";
import Loader from "../../components/Loader";
import ErrorMessage from "../../components/ErrorMessage";

type InvitationValidationResponse = {
  data?: unknown;
};

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function InvitationValidatePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [inviteData, setInviteData] = useState<unknown>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const result =
          (await invitationsService.validate(token)) as InvitationValidationResponse;
        setInviteData(result?.data || result);
      } catch (error: unknown) {
        setError(getErrorMessage(error, "Invitation validation failed"));
      } finally {
        setLoading(false);
      }
    };

    if (token) run();
    else {
      setError("Missing token");
      setLoading(false);
    }
  }, [token]);

  const handleContinue = () => {
    navigate(`/signup?invitationToken=${encodeURIComponent(token)}`, {
      state: {
        invitationToken: token,
      },
    });
  };

  return (
    <div className="page">
      <div className="card auth-card">
        <AuthCardHeader title="Invitation" />

        {loading && <Loader text="Validating invitation..." />}
        <ErrorMessage message={error} />

        {!loading && !error && (
          <>
            <div className="section">
              <p><strong>Invitation is valid.</strong></p>
              <pre className="pre">{JSON.stringify(inviteData, null, 2)}</pre>
            </div>

            <div className="stack">
              <button className="button" onClick={handleContinue}>
                Continue to Signup
              </button>
              <Link className="button button-secondary" to="/login">
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
