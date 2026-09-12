import useLoading from "../hooks/useLoading";
import Loader from "./Loader";

export default function GlobalLoader() {
  const isLoading = useLoading();

  if (!isLoading) {
    return null;
  }

  // Rendered above the router, so it cannot know which restaurant is in view.
  return (
    <div className="loader-container">
      <div className="loader-backdrop" />
      <Loader fullscreen text={null} />
    </div>
  );
}
