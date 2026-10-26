type Props = {
  text?: string | null;
  fullscreen?: boolean;
};

// No restaurant is known yet at this point (auth, routing, the directory
// list), so there is nothing to brand this wait with — a neutral spinner,
// never the platform's own logo.
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
      <span className="loader-spinner" aria-hidden="true" />
      {text ? <span className="loader-text">{text}</span> : null}
    </div>
  );
}
