import Logo from "../../assets/Logo_DarkBlue.svg";

type Props = {
  title: string;
};

export default function AuthCardHeader({ title }: Props) {
  return (
    <div className="auth-brand">
      <img
        className="auth-brand-logo"
        src={Logo}
        alt="The TBL Workspace"
        style={{ marginBottom: "1rem" }}
      />
      <h1 className="auth-brand-title">{title}</h1>
    </div>
  );
}
