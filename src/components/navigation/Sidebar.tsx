import type { JSX } from "react";
import { NavLink } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import type { SessionUser } from "../../types/auth";
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
  const displayName = getDisplayName(user);
  const email = user?.email ?? "No email";
  const initials = getAvatarInitials(user);

  const primaryNavItems: NavItem[] = [
    {
      to: "/restaurants",
      label: "Restaurants",
      icon: RestaurantsIcon,
    },
    {
      to: "/reservations",
      label: "Reservations",
      icon: ReservationsIcon,
    },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-main">
        <div className="sidebar-brand">
          <img
            src={Logo}
            alt="The TBL guest app logo"
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
