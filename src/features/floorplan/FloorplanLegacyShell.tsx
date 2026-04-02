import type { RefObject } from "react";

export default function FloorplanLegacyShell({
  rootRef,
  branchId,
  branchName,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  branchId: string;
  branchName?: string;
}) {
  return (
    <div
      ref={rootRef}
      className="floorplan-builder-root"
      data-branch-id={branchId}
      data-branch-name={branchName || ""}
    >
      <div className="floorplan-phase-banner">
        <div>
          <strong>Phase 1 scaffold mounted.</strong> Legacy floorplan DOM shell is now inside React.
        </div>
        <div className="floorplan-phase-meta">
          Branch: {branchName || branchId}
        </div>
      </div>

      {/* Hidden placeholders kept for Phase 2 compatibility */}
      <div id="login-overlay" style={{ display: "none" }} />
      <div id="branch-overlay" style={{ display: "none" }} />
      <div id="branch-list" style={{ display: "none" }} />
      <div id="branch-loading" style={{ display: "none" }} />
      <div id="branch-error" style={{ display: "none" }} />
      <button id="btn-logout-branch" style={{ display: "none" }} />

      <div className="floorplan-app-shell" id="main-app">
        <header className="floorplan-toolbar">
          <span className="floorplan-logo">TBL Floorplan</span>

          <select
            id="version-selector"
            className="floorplan-btn"
            style={{ minWidth: 180 }}
            disabled
            defaultValue=""
          >
            <option value="">Phase 2 will load versions</option>
          </select>

          <button id="btn-create-draft" className="floorplan-btn" disabled>
            📝 Create Draft
          </button>

          <button id="btn-publish" className="floorplan-btn floorplan-btn-primary" disabled>
            🚀 Publish
          </button>

          <div className="floorplan-spacer" />

          <span id="tool-indicator" className="floorplan-tool-indicator">
            Phase 1 shell only
          </span>

          <div className="floorplan-spacer" />

          <button id="btn-zone-draw" className="floorplan-btn" disabled>
            🔷 Draw Zone
          </button>
          <button id="btn-combine" className="floorplan-btn" disabled>
            🔗 Combine
          </button>
          <button id="btn-view-mode" className="floorplan-btn" disabled>
            👁 Guest View
          </button>
          <button id="btn-reset" className="floorplan-btn floorplan-btn-danger" disabled>
            ↺ Reset
          </button>
          <button id="btn-logout" className="floorplan-btn" disabled>
            🚪 Logout
          </button>
        </header>

        <aside className="floorplan-sidebar">
          <h4>Templates</h4>
          <div id="templates-list" className="floorplan-placeholder-list">
            <div className="floorplan-placeholder-item">Templates will mount here in Phase 2</div>
          </div>

          <h4>Floors</h4>
          <div id="floors-list" className="floorplan-placeholder-list">
            <div className="floorplan-placeholder-item">Floors list placeholder</div>
          </div>
          <button id="btn-add-floor" className="floorplan-btn floorplan-full-width" disabled>
            + Add Floor
          </button>

          <h4>Zones</h4>
          <div id="zones-list" className="floorplan-placeholder-list">
            <div className="floorplan-placeholder-item">Zones placeholder</div>
          </div>

          <h4>Combine Edges</h4>
          <div id="edges-list" className="floorplan-placeholder-list">
            <div className="floorplan-placeholder-item">Combine edges placeholder</div>
          </div>
        </aside>

        <main className="floorplan-canvas-container">
          <canvas id="floorplan-canvas" className="floorplan-canvas" />
          <div className="floorplan-canvas-placeholder">
            <div className="floorplan-canvas-placeholder-title">
              Floorplan canvas scaffold
            </div>
            <div className="floorplan-canvas-placeholder-text">
              In Phase 2, the legacy canvas engine will mount here and use the exact IDs already rendered.
            </div>
          </div>
        </main>

        <aside className="floorplan-inspector">
          <div id="inspector-content">
            <p className="floorplan-empty-text">
              Inspector placeholder — will be controlled by legacy UI in Phase 2.
            </p>
          </div>
        </aside>

        {/* Hidden mobile viewer placeholders for Phase 2 compatibility */}
        <div id="mobile-viewer" style={{ display: "none" }}>
          <div id="mobile-floor-tabs" />
          <div id="mobile-zone-chips" />
          <canvas id="mobile-canvas" />
          <div id="mobile-table-info" />
          <button id="mobile-close" />
        </div>
      </div>
    </div>
  );
}