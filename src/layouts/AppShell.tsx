import type { ReactNode } from "react";
import Sidebar from "../components/navigation/Sidebar";
import Topbar from "../components/navigation/Topbar";

export default function AppShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="app-main">
        <Topbar />

        <main className="app-content">
          <div>
            <h1 className="page-title">{title}</h1>
          </div>

          <div style={{ display: "grid", gap: 16 }}>{children}</div>
        </main>
      </div>
    </div>
  );
}
