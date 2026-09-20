import { usePresentation } from "./presentation";
import type { WebsiteConfigV1 } from "./contract";

export type Features = WebsiteConfigV1["features"];

/**
 * Every capability, for a restaurant that has no published website
 * configuration — the hand-coded chrome, where all of them have always been
 * available.
 */
const ALL_ON: Features = {
  menu: true,
  reservations: true,
  tableSelection: true,
};

/**
 * What this restaurant's website can do.
 *
 * Defaulting to on matters: `config` is also null while the configuration is
 * still loading, and defaulting to off would blink the reservation button out
 * of the header on every page load.
 */
export function useFeatures(): Features {
  return usePresentation().config?.features ?? ALL_ON;
}
