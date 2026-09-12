import useTenant from "../../hooks/useTenant";

type Props = {
  title: string;
};

export default function AuthCardHeader({ title }: Props) {
  const { tenant } = useTenant();
  return (
    <div className="auth-brand">
      <div className="wl-wordmark wl-auth-wordmark" aria-label={tenant?.name}>
        <span className="wl-wordmark-main">{tenant?.name || "Restaurant"}</span>
      </div>
      <h1 className="auth-brand-title">{title}</h1>
    </div>
  );
}
