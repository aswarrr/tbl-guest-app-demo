import type { FloorplanTemplate } from "./types";

/**
 * A table's footprint. A circle is authored as a radius and everything else as
 * width and height, so both are reduced to one box before drawing or
 * hit-testing. The fallback covers a template saved without dimensions.
 */
export function tableSize(type: FloorplanTemplate) {
  const w = type.shape === "circle" ? type.radius * 2 : type.width;
  const h = type.shape === "circle" ? type.radius * 2 : type.height;
  return { w: w || 50, h: h || 50 };
}
