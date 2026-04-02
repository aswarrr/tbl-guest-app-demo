import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

type Props = {
  title?: string;
  children: ReactNode;
};

export default function AppLayout({ title = "TBL", children }: Props) {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="page">
      <div className="card">
        <div className="section">
          <h1>{title}</h1>

          <div className="stack">
            <Link className="button button-secondary" to="/">
              Dashboard
            </Link>

            {!isAuthenticated ? (
              <>
                <Link className="button" to="/login">
                  Login
                </Link>
                <Link className="button button-secondary" to="/signup">
                  Signup
                </Link>
              </>
            ) : (
              <button className="button" onClick={logout}>
                Logout
              </button>
            )}
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}