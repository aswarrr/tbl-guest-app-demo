import { NavLink } from "react-router-dom";
import useAuth from "../hooks/useAuth";

function navStyle(isActive: boolean) {
  return {
    display: "block",
    padding: "12px 14px",
    borderRadius: 10,
    textDecoration: "none",
    color: "white",
    background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
    fontWeight: isActive ? 700 : 500,
  };
}

export default function Sidebar() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.isSuperAdmin;

  return (
    <aside
      style={{
        borderRight: "1px solid rgba(255,255,255,0.08)",
        padding: 20,
        background: "#111827",
      }}
    >
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, opacity: 0.7 }}>TBL</div>
        <div style={{ fontSize: 22, fontWeight: 800 }}>Workspace</div>
      </div>

      <nav style={{ display: "grid", gap: 8 }}>
        <NavLink to="/" end style={({ isActive }) => navStyle(isActive)}>
          Home
        </NavLink>

        {isSuperAdmin && (
          <NavLink to="/companies" style={({ isActive }) => navStyle(isActive)}>
            Restaurants
          </NavLink>
        )}

        <NavLink to="/staff" style={({ isActive }) => navStyle(isActive)}>
          Staff
        </NavLink>

        <NavLink to="/invitations" style={({ isActive }) => navStyle(isActive)}>
          Invitations
        </NavLink>

        <NavLink to="/debug/session" style={({ isActive }) => navStyle(isActive)}>
          Session Debug
        </NavLink>
      </nav>
    </aside>
  );
}
