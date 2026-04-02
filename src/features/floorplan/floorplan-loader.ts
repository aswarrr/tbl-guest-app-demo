import legacyIndexHtml from "./legacy/index.html?raw";
import legacyStyleCss from "./legacy/style.css?raw";
import legacyAppJs from "./legacy/app.js?raw";
import legacyCanvasJs from "./legacy/canvas.js?raw";
import legacyUiJs from "./legacy/ui.js?raw";

export type BuildFloorplanSrcDocOptions = {
  branchId: string;
  branchName?: string;
  accessToken: string;
  apiBaseUrl: string;
};

function escapeInlineScript(code: string) {
  return code.replace(/<\/script/gi, "<\\/script");
}

function extractBodyContent(html: string) {
  const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return match ? match[1] : html;
}

function stripScriptTags(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "");
}

function transformAppScript(raw: string) {
  let next = raw;

  next = next.replace(
    "const STORAGE_KEY = 'floorplan_dynamic_v1';",
    "const STORAGE_KEY = window.__TBL_FLOORPLAN_CONFIG.storageKey;"
  );

  next = next.replace(
    "branchId: 'branch-001',",
    "branchId: window.__TBL_FLOORPLAN_CONFIG.branchId,"
  );

  next =
    `
const API_BASE_URL = window.__TBL_FLOORPLAN_CONFIG.apiBaseUrl;
const TOKEN_KEY = window.__TBL_FLOORPLAN_CONFIG.tokenKey;
` + next;

  return next;
}

function transformUiScript(raw: string) {
  const bootRegex =
    /document\.addEventListener\('DOMContentLoaded',\s*\(\)\s*=>\s*\{[\s\S]*?refreshUI\(\);\s*\}\);?/m;

  const replacement = `
window.__floorplanLegacyInit = async function () {
  const loginOverlay = document.getElementById('login-overlay');
  const branchOverlay = document.getElementById('branch-overlay');
  const mainApp = document.getElementById('main-app');
  const btnLogout = document.getElementById('btn-logout');
  const btnLogoutBranch = document.getElementById('btn-logout-branch');

  if (loginOverlay) loginOverlay.style.display = 'none';
  if (branchOverlay) branchOverlay.style.display = 'none';
  if (mainApp) mainApp.style.display = 'grid';
  if (btnLogout) btnLogout.style.display = 'none';
  if (btnLogoutBranch) btnLogoutBranch.style.display = 'none';

  initApp();
  initCanvas();
  setupToolbar();
  refreshUI();

  if (typeof loadDynamicFloorplan === 'function') {
    await loadDynamicFloorplan(window.__TBL_FLOORPLAN_CONFIG.branchId);
  }

  refreshUI();
};

window.addEventListener('load', () => {
  window.__floorplanLegacyInit().catch((err) => {
    console.error('Floorplan legacy init failed:', err);
  });
});
`;

  return raw.replace(bootRegex, replacement);
}

function buildBootstrapScript({
  branchId,
  branchName,
  accessToken,
  apiBaseUrl,
}: BuildFloorplanSrcDocOptions) {
  const config = {
    branchId,
    branchName: branchName || "",
    accessToken,
    apiBaseUrl,
    tokenKey: "floorplan_auth_token",
    storageKey: `floorplan_dynamic_${branchId}`,
  };

  return `
window.__TBL_FLOORPLAN_CONFIG = ${JSON.stringify(config, null, 2)};
try {
  localStorage.setItem(window.__TBL_FLOORPLAN_CONFIG.tokenKey, window.__TBL_FLOORPLAN_CONFIG.accessToken);
} catch (e) {
  console.warn("Unable to persist floorplan token in iframe localStorage", e);
}
`;
}

export function buildFloorplanSrcDoc(options: BuildFloorplanSrcDocOptions) {
  const bodyHtml = stripScriptTags(extractBodyContent(legacyIndexHtml));

  const inlineCss = `
${legacyStyleCss}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

body {
  overflow: hidden;
}

#login-overlay,
#branch-overlay {
  display: none !important;
}

#main-app {
  display: grid !important;
}
`;

  const bootstrapScript = buildBootstrapScript(options);
  const appScript = transformAppScript(legacyAppJs);
  const canvasScript = legacyCanvasJs;
  const uiScript = transformUiScript(legacyUiJs);

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TBL Floorplan</title>
    <style>${inlineCss}</style>
  </head>
  <body>
    ${bodyHtml}

    <script>${escapeInlineScript(bootstrapScript)}</script>
    <script>${escapeInlineScript(appScript)}</script>
    <script>${escapeInlineScript(canvasScript)}</script>
    <script>${escapeInlineScript(uiScript)}</script>
  </body>
</html>
`;
}