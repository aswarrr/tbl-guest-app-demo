import useLoading from "../hooks/useLoading";
import Loader from "./Loader";

export default function GlobalLoader() {
  const isLoading = useLoading();

  if (!isLoading) {
    return null;
  }

  return (
    <div className="loader-container">
      <div className="loader-backdrop" />
      <Loader fullscreen text={null} />
    </div>
  );
}
