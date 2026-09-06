import useTenant from "../../hooks/useTenant";

type Props = {
  title: string;
};

export default function AuthCardHeader({ title }: Props) {
  const { tenant } = useTenant();
  return (
    <div className="auth-brand">
      <div className="wl-wordmark wl-auth-wordmark" aria-label={tenant?.displayName}>
        <span className="wl-wordmark-main">{tenant?.shortName || "Restaurant"}</span>
        <span className="wl-wordmark-sub">Steak House &amp; Co.</span>
      </div>
      <h1 className="auth-brand-title">{title}</h1>
    </div>
  );
}
