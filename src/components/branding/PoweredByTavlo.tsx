import tavloWordmark from "../../assets/branding/tavlo-wordmark.png";
import tavloWordmarkLight from "../../assets/branding/tavlo-wordmark-light.png";
import "./PoweredByTavlo.css";

type Props = {
  /** Which surface the footer sits on: "light" (default) is a white/paper
   * background and uses the dark wordmark; "dark" is a dark surface (e.g.
   * the site footer band) and uses the cream wordmark. */
  surface?: "light" | "dark";
  className?: string;
};

/**
 * The one place the platform names itself to a guest. Every guest-facing
 * layout renders this once, at the very end of the page, instead of any
 * page repeating "Powered by ..." on its own.
 *
 * There is no Tavlo marketing URL anywhere in this codebase yet, so the mark
 * renders unlinked. Once one exists, wire it in here rather than at each
 * call site.
 */
export default function PoweredByTavlo({ surface = "light", className = "" }: Props) {
  return (
    <p className={`powered-by-tavlo ${className}`.trim()}>
      <span>Powered by</span>
      <img
        src={surface === "dark" ? tavloWordmarkLight : tavloWordmark}
        alt="Tavlo"
        className="powered-by-tavlo-mark"
      />
      <span>· Est. 2026</span>
    </p>
  );
}
