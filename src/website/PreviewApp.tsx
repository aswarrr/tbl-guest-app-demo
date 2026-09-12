import { validSnapshot } from "./snapshot";
import { useEffect, useLayoutEffect, useState } from "react";
import { TenantContext } from "../context/tenant-context";
import { AuthContext } from "../context/auth-context";
import { PresentationContext } from "./presentation";
import {
  isRecord,
  sectionIds,
  validateConfig,
  type PreviewSnapshot,
  type WebsiteConfigV1,
} from "./contract";
import { StudioSite } from "./StudioSite";

type Update = {
  config: WebsiteConfigV1;
  snapshot: PreviewSnapshot;
  revision: number;
  updateId: number;
  selection: string;
  branchId: string | null;
  page: string;
};
const params = new URLSearchParams(window.location.search);
const session = params.get("builderSession");
const parentOrigin = params.get("parentOrigin");
const companyId = params.get("companyId");
const tenant = decodeURIComponent(window.location.pathname.split("/")[1] || "");
const allowed = (import.meta.env.VITE_WEBSITE_WORKSPACE_ORIGINS || "")
  .split(",")
  .map((v: string) => v.trim())
  .filter(Boolean);
const authorized =
  !!parentOrigin &&
  allowed.includes(parentOrigin) &&
  window.parent !== window &&
  !!session &&
  !!companyId;
function send(type: string, payload: object = {}) {
  if (authorized)
    window.parent.postMessage(
      {
        channel: "tbl.website",
        protocol: 2,
        schema: 1,
        session,
        companyId,
        tenant,
        type,
        ...payload,
      },
      parentOrigin!,
    );
}
const disabledAuth = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isBootstrapping: false,
  setSession: async () => {},
  login: async () => {},
  logout: () => {},
  refreshSession: async () => {},
};
export default function PreviewApp() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [error, setError] = useState(
    authorized
      ? "Waiting for Website Studio."
      : "This Workspace origin is not allowed to preview websites.",
  );
  useEffect(() => {
    let initialized = false;
    let latest = 0;
    const timeout = setTimeout(() => {
      setUpdate(null);
      setError("Preview timed out. Retry from Website Studio.");
    }, 8000);
    function receive(event: MessageEvent) {
      const d = event.data;
      if (
        !authorized ||
        event.source !== window.parent ||
        event.origin !== parentOrigin ||
        !isRecord(d) ||
        d.channel !== "tbl.website" ||
        d.session !== session ||
        d.tenant !== tenant ||
        d.companyId !== companyId
      )
        return;
      if (d.protocol !== 2 || d.schema !== 1) {
        setUpdate(null);
        setError("Incompatible Website Studio. Reload both applications.");
        send("ERROR");
        return;
      }
      if (d.type === "INIT") {
        initialized = true;
        latest = 0;
        setUpdate(null);
        send("READY", {
          capabilities: [
            "draft",
            "selection",
            "highlight",
            "suppress-mutations",
            "display-snapshot",
          ],
        });
        return;
      }
      if (!initialized || d.type !== "UPDATE") return;
      if (
        typeof d.updateId !== "number" ||
        !Number.isSafeInteger(d.updateId) ||
        d.updateId <= latest
      )
        return;
      const snapshot = d.snapshot;
      if (
        validateConfig(d.config, companyId!).length ||
        !validSnapshot(snapshot, companyId!, tenant) ||
        typeof d.revision !== "number" ||
        typeof d.selection !== "string" ||
        !sectionIds.includes(d.selection) ||
        !["home", "about", "locations", "policies", "reserve", "menu"].includes(
          String(d.page),
        ) ||
        (d.branchId !== null &&
          !snapshot.branches.some((b) => b.id === d.branchId))
      ) {
        setUpdate(null);
        setError("Invalid preview data. Refresh restaurant details and retry.");
        send("ERROR");
        return;
      }
      latest = d.updateId;
      clearTimeout(timeout);
      setError("");
      setUpdate(d as unknown as Update);
    }
    window.addEventListener("message", receive);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", receive);
    };
  }, []);
  useLayoutEffect(() => {
    if (update)
      send("APPLIED", {
        revision: update.revision,
        updateId: update.updateId,
        contextRevision: update.snapshot.revision,
      });
  }, [update]);
  if (!update)
    return (
      <main className="wl-state-page">
        <h1>Website design preview</h1>
        <p role="status">{error}</p>
        <p>Booking is disabled.</p>
      </main>
    );
  return (
    <AuthContext.Provider value={disabledAuth}>
      <TenantContext.Provider
        value={{
          tenant: update.snapshot.company,
          tenantSlug: tenant,
          branches: update.snapshot.branches,
          menu: update.snapshot.menu,
          loading: false,
          error: "",
          notFound: false,
          refresh: async () => {},
        }}
      >
        <PresentationContext.Provider
          value={{
            config: update.config,
            preview: true,
            selection: update.selection,
            branchId: update.branchId,
            select: (id) =>
              send("SELECT", { section: id, updateId: update.updateId }),
          }}
        >
          <StudioSite page={update.page} />
        </PresentationContext.Provider>
      </TenantContext.Provider>
    </AuthContext.Provider>
  );
}
