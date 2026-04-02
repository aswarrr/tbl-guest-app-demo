import Logo from "../assets/Logo_DarkBlue.svg";

type Props = {
  text?: string | null;
  fullscreen?: boolean;
};

export default function Loader({
  text = "Loading...",
  fullscreen = false,
}: Props) {
  return (
    <div
      className={`loader-inline${fullscreen ? " loader-inline-fullscreen" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={text || "Loading"}
    >
      <span className="loader-brandmark" aria-hidden="true">
        <img className="loader-logo loader-logo-base" src={Logo} alt="" />
        <span className="loader-logo-reveal">
          <img
            className="loader-logo loader-logo-highlight"
            src={Logo}
            alt=""
          />
        </span>
      </span>
      {text ? <span className="loader-text">{text}</span> : null}
    </div>
  );
}
