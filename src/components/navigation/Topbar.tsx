import { useEffect, useMemo, useState } from "react";
import useAuth from "../../hooks/useAuth";
import type { SessionUser } from "../../types/auth";

function getDisplayName(user: SessionUser | null) {
  if (!user) return "Unknown User";

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fullName) return fullName;

  return user.username ?? user.email ?? user.id ?? "Unknown User";
}

function getFirstName(user: SessionUser | null) {
  if (!user) return "there";

  const firstName = user.firstName?.trim();
  if (firstName) return firstName;

  const displayName = getDisplayName(user);
  return displayName.split(/\s+/)[0] || "there";
}

function getRoleLabel(user: SessionUser | null) {
  if (user?.isSuperAdmin) return "Super Admin";
  if ((user?.companyRoles?.length ?? 0) > 0 && (user?.branchRoles?.length ?? 0) > 0) {
    return "Company & Branch Access";
  }
  if ((user?.companyRoles?.length ?? 0) > 0) return "Company Manager";
  if ((user?.branchRoles?.length ?? 0) > 0) return "Branch Manager";
  return "Workspace Member";
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="topbar-icon"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5l3 1.8" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="topbar-icon"
      aria-hidden="true"
    >
      <path d="M6.5 10.2a5.5 5.5 0 1 1 11 0c0 5.3 2 6.1 2 6.1h-15s2-.8 2-6.1" />
      <path d="M10 19.5a2.3 2.3 0 0 0 4 0" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="topbar-icon"
      aria-hidden="true"
    >
      <path d="M14 3h-5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h5" />
      <path d="M10.5 12h10" />
      <path d="m17 8.5 3.5 3.5-3.5 3.5" />
    </svg>
  );
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const currentTime = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(now),
    [now]
  );

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      }).format(now),
    [now]
  );

  const firstName = getFirstName(user);
  const roleLabel = getRoleLabel(user);
  const displayName = getDisplayName(user);

  return (
    <header className="app-topbar">
      <div className="topbar-greeting">
        {/* <div className="topbar-eyebrow">Operations Workspace</div> */}
        <div className="topbar-title">
          Welcome back, <span className="topbar-title-name">{firstName}</span>.
        </div>
        <div className="topbar-subtitle">
          <span>{roleLabel}</span>
          <span className="topbar-subtitle-separator" aria-hidden="true">
            |
          </span>
          <span>{user?.email ?? displayName}</span>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="topbar-clock-card" aria-label={`Current time ${currentTime}`}>
          <div className="topbar-icon-shell">
            <ClockIcon />
          </div>

          <div className="topbar-clock-copy">
            <div className="topbar-clock-time">{currentTime}</div>
            <div className="topbar-clock-date">{currentDate}</div>
          </div>
        </div>

        <button
          className="topbar-icon-button"
          type="button"
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon />
          <span className="topbar-notification-dot" aria-hidden="true" />
        </button>

        <button className="topbar-logout-btn" type="button" onClick={logout}>
          <LogoutIcon />
          <span>Log out</span>
        </button>
      </div>
    </header>
  );
}
