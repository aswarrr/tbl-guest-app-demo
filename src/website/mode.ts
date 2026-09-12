// Latched before providers mount. An invalid preview remains a preview.
export const previewMode =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("builderPreview");
export function assertLiveRequest() {
  if (previewMode)
    throw new Error("Network requests are disabled in website design preview.");
}
