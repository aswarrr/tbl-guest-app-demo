import type { JSX } from "react";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import type { SessionUser } from "../../types/auth";
import { getReservationAccess } from "../../utils/reservations";
import Logo from "../../assets/Logo_DarkBlue.svg";

type NavItem = {
  to: string;
  label: string;
  icon: () => JSX.Element;
};

function getDisplayName(user: SessionUser | null) {
  if (!user) return "Unknown User";

  const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  if (fullName) return fullName;

  return user.username ?? user.email ?? user.id ?? "Unknown User";
}

function getAvatarInitials(user: SessionUser | null) {
  if (!user) return "UU";

  const first = user.firstName?.trim()?.[0] ?? "";
  const last = user.lastName?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();

  if (initials.trim()) return initials;

  const displayName = getDisplayName(user);
  const displayParts = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");

  return displayParts.join("") || "UU";
}

function RestaurantsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="sidebar-nav-icon" aria-hidden="true">
      <path
        d="M4.5 20.5h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.5 20.5V8.5l5.5-4 5.5 4v12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 12h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReservationsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="sidebar-nav-icon" aria-hidden="true">
      <rect
        x="4.5"
        y="6.5"
        width="15"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 4.5v4M16 4.5v4M4.5 10.25h15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="sidebar-nav-icon" aria-hidden="true">
      <path
        d="M12 8.75a3.25 3.25 0 1 1 0 6.5 3.25 3.25 0 0 1 0-6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m19 13.1.05-2.2-2.12-.63a5.7 5.7 0 0 0-.63-1.5l1.05-1.93-1.55-1.56-1.94 1.06a5.7 5.7 0 0 0-1.5-.62L10.9 3h-2.2l-.63 2.12a5.7 5.7 0 0 0-1.5.63L4.64 4.7 3.08 6.26l1.06 1.94a5.7 5.7 0 0 0-.62 1.5L1.4 10.33v2.2l2.12.63a5.7 5.7 0 0 0 .63 1.5l-1.06 1.94 1.56 1.55 1.93-1.05a5.7 5.7 0 0 0 1.5.63l.63 2.12h2.2l.63-2.12a5.7 5.7 0 0 0 1.5-.63l1.94 1.06 1.55-1.56-1.05-1.93c.28-.48.49-.99.62-1.5L19 13.1Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="sidebar-nav-icon" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.9 9.4a2.45 2.45 0 1 1 4.13 2.03c-.86.74-1.53 1.25-1.53 2.32"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="16.9" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="sidebar-profile-chevron" aria-hidden="true">
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Sidebar() {
  const { user } = useAuth();
  const isSuperAdmin = !!user?.isSuperAdmin;
  const companyRoles = Array.isArray(user?.companyRoles) ? user.companyRoles : [];
  const branchRoles = Array.isArray(user?.branchRoles) ? user.branchRoles : [];
  const canAccessBranches = isSuperAdmin || companyRoles.length > 0 || branchRoles.length > 0;
  const reservationAccess = getReservationAccess(user);
  const displayName = getDisplayName(user);
  const email = user?.email ?? "No email";
  const initials = getAvatarInitials(user);

  const primaryNavItems: NavItem[] = [];

  if (canAccessBranches) {
    primaryNavItems.push({
      to: "/branches",
      label: "Home",
      icon: RestaurantsIcon,
    });
  }

  if (reservationAccess.hasAccess) {
    primaryNavItems.push({
      to: "/reservations",
      label: "Reservations",
      icon: ReservationsIcon,
    });
  }

  return (
    <aside className="app-sidebar">
      <div className="sidebar-main">
        <div className="sidebar-brand">
          <img
            src={Logo}
            alt="The TBL Workspace Logo"
            className="sidebar-brand-logo"
          />
        </div>

        <nav className="nav-list">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                <Icon />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="nav-list nav-list-secondary">
          <button type="button" className="nav-link nav-link-button">
            <SettingsIcon />
            <span>Settings</span>
          </button>

          <button type="button" className="nav-link nav-link-button">
            <HelpIcon />
            <span>Help & Support</span>
          </button>
        </div>

        <button type="button" className="sidebar-profile-card">
          <span className="sidebar-profile-avatar" aria-hidden="true">
            {initials}
          </span>

          <span className="sidebar-profile-copy">
            <span className="sidebar-profile-name">{displayName}</span>
            <span className="sidebar-profile-email">{email}</span>
          </span>

          <ChevronRightIcon />
        </button>
      </div>
    </aside>
  );
}
