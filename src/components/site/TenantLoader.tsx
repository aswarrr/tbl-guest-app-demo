import Loader from "../Loader";
import type { CSSProperties } from "react";
import type { TenantConfig } from "../../white-label/types";

type Props = {
  tenant: TenantConfig | null;
  text?: string | null;
  fullscreen?: boolean;
};

export default function TenantLoader({ tenant, text = "Loading…", fullscreen = false }: Props) {
  if (!tenant) {
    return <Loader text={text} fullscreen={fullscreen} />;
  }

  const wordmarkSubtitle = tenant.displayName.startsWith(tenant.shortName)
    ? tenant.displayName.slice(tenant.shortName.length).trim() || tenant.tagline
    : tenant.tagline;
  const themeStyle = {
    "--wl-accent": tenant.theme.accent,
    "--wl-ink": tenant.theme.ink,
  } as CSSProperties;

  return (
    <div
      className={`wl-brand-loader${fullscreen ? " wl-brand-loader-fullscreen" : ""}`}
      style={themeStyle}
      role="status"
      aria-live="polite"
      aria-label={text || `Loading ${tenant.displayName}`}
    >
      <span className="wl-brand-loader-mark" aria-hidden="true">
        <span className="wl-brand-loader-name">{tenant.shortName}</span>
        <span className="wl-brand-loader-subtitle">{wordmarkSubtitle}</span>
      </span>
      {text ? <span className="wl-brand-loader-text">{text}</span> : null}
    </div>
  );
}
