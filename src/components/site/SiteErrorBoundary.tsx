import { Component, type ErrorInfo, type ReactNode } from "react";

export default class SiteErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Restaurant website error", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="wl-state-page">
          <span className="wl-kicker">Something went wrong</span>
          <h1>We couldn’t set the table.</h1>
          <p>Please refresh the page and try again.</p>
          <button className="wl-button" type="button" onClick={() => window.location.reload()}>Refresh page</button>
        </main>
      );
    }
    return this.props.children;
  }
}
