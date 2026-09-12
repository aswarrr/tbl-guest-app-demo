import Loader from "../Loader";
import type { TenantCompany } from "../../white-label/types";

type Props = {
  tenant: TenantCompany | null;
  text?: string | null;
  fullscreen?: boolean;
};

/** A branded wait, once we know whose site this is. */
export default function TenantLoader({ tenant, text = "Loading…", fullscreen = false }: Props) {
  if (!tenant) {
    return <Loader text={text} fullscreen={fullscreen} />;
  }

  return (
    <div
      className={`wl-brand-loader${fullscreen ? " wl-brand-loader-fullscreen" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={text || `Loading ${tenant.name}`}
    >
      <span className="wl-brand-loader-mark" aria-hidden="true">
        <span className="wl-brand-loader-name">{tenant.name}</span>
      </span>
      {text ? <span className="wl-brand-loader-text">{text}</span> : null}
    </div>
  );
}
