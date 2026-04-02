import { useMemo, useState } from "react";
import useAuth from "../../hooks/useAuth";
import { buildFloorplanSrcDoc } from "./floorplan-loader";
import "./floorplan.css";

export default function FloorplanBuilderHost({
  branchId,
  branchName,
  title = "Step 2: Floor Plan Builder",
  description,
}: {
  branchId: string;
  branchName?: string;
  title?: string;
  description?: string;
}) {
  const { accessToken } = useAuth();
  const [loaded, setLoaded] = useState(false);

  const apiBaseUrl = useMemo(() => {
    const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(
      /\/$/,
      ""
    );
    return `${base}/api`;
  }, []);

  const srcDoc = useMemo(() => {
    if (!accessToken || !branchId) return "";

    return buildFloorplanSrcDoc({
      branchId,
      branchName,
      accessToken,
      apiBaseUrl,
    });
  }, [accessToken, branchId, branchName, apiBaseUrl]);

  if (!branchId) {
    return (
      <section className="surface">
        <div style={{ color: "#991b1b", fontWeight: 700 }}>
          Missing branch ID for floorplan builder.
        </div>
      </section>
    );
  }

  if (!accessToken) {
    return (
      <section className="surface">
        <div style={{ color: "#991b1b", fontWeight: 700 }}>
          Missing access token for floorplan builder.
        </div>
      </section>
    );
  }

  return (
    <section className="surface">
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: "#111827" }}>
          {title}
        </div>
        <div style={{ color: "#6b7280", marginTop: 4 }}>
          {description || (
            <>
              Legacy floorplan builder is mounted for branch{" "}
              <strong>{branchName || branchId}</strong>.
            </>
          )}
        </div>
      </div>

      {!loaded && (
        <div className="surface-muted" style={{ marginBottom: 16 }}>
          Loading floorplan builder...
        </div>
      )}

      <div className="floorplan-host-frame-wrap">
        <iframe
          title={`Floorplan Builder - ${branchName || branchId}`}
          className="floorplan-host-frame"
          srcDoc={srcDoc}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </section>
  );
}
