/** Choose the higher-contrast foreground for a validated hex background. */
export function contrastTextFor(hex: string): "#ffffff" | "#000000" {
  let value = hex.replace("#", "");
  if (value.length === 3) value = value.split("").map((c) => c + c).join("");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "#ffffff";
  const rgb = [0, 2, 4].map((n) => parseInt(value.slice(n, n + 2), 16) / 255)
    .map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  return 1.05 / (luminance + 0.05) >= (luminance + 0.05) / 0.05 ? "#ffffff" : "#000000";
}
