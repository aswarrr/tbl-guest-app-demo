import type { AvailableSeatingOption } from "../../../white-label/types";

/**
 * Joining what is bookable to what is drawn.
 *
 * Availability is expressed as seating *options* — a single table, or two
 * joined for a larger party — while the floorplan is a set of physical tables.
 * One table can therefore appear in several options, and an option can cover
 * more than one table.
 */

/** Every option each physical table takes part in. */
export function optionsByTableId(options: AvailableSeatingOption[]) {
  const byTableId = new Map<string, AvailableSeatingOption[]>();
  for (const option of options)
    for (const id of option.tableIds) {
      const list = byTableId.get(id);
      if (list) list.push(option);
      else byTableId.set(id, [option]);
    }
  return byTableId;
}

/**
 * Which option a guest gets by tapping a given table.
 *
 * A table can be bookable both on its own and as half of a joined pair.
 * Booking it alone wins — the same preference the server applies when it picks
 * a table itself, so what a guest can tap agrees with what they would
 * otherwise have been given. A table reachable only by joining offers the
 * smallest combination, to keep the larger ones free for larger parties.
 */
export function optionForTable(options: AvailableSeatingOption[]) {
  const single = options.find((option) => option.type === "SINGLE");
  if (single) return single;
  return [...options].sort(
    (a, b) => a.tableIds.length - b.tableIds.length || a.id.localeCompare(b.id),
  )[0];
}
