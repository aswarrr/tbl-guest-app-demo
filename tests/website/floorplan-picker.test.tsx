import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import FloorplanPicker from "../../src/components/site/floorplan/FloorplanPicker";
import type { FloorplanFloor, FloorplanTable, GuestFloorplan } from "../../src/components/site/floorplan/types";
import type { AvailableSeatingOption } from "../../src/white-label/types";

const table: FloorplanTable = {
  id: "t1", label: "G01", x: 180, y: 220, rotation: 30, scaleX: 1.2, scaleY: 1,
  zoneId: "garden", isActive: true,
  template: { name: "2-Top Round", type: "dining", fixtureKind: null, shape: "circle",
    width: 44, height: 44, radius: 22, isReservable: true, isCombinable: true,
    minPartySize: 1, maxPartySize: 2,
    chairs: [{ id: "chair1", x: 0, y: 34, rotation: 180, width: 10, depth: 12 }],
  },
};
const floor: FloorplanFloor = {
  id: "room", name: "The Cedar Room", sortOrder: 0, isMain: true,
  backgroundImageUrl: null, backgroundWidth: 1100, backgroundHeight: 780,
  zones: [{ id: "garden", name: "Garden Dining", polygonPoints: [{ x: 60, y: 65 }, { x: 480, y: 65 }, { x: 480, y: 455 }] }],
  tables: [table, { ...table, id: "t2", label: "G02", x: 350 },
    { ...table, id: "plant", label: "PL01", template: { ...table.template, type: "fixture", fixtureKind: "plant", isReservable: false } }],
};
const layout: GuestFloorplan = { versionId: "v4", versionNo: 4, publishedAt: null, floors: [floor] };
const single: AvailableSeatingOption = { id: "single", name: "G01", type: "SINGLE", tableIds: ["t1"], availableTimes: ["19:00"] };
const combo: AvailableSeatingOption = { id: "joined", name: "G01 + G02", type: "COMBO", tableIds: ["t1", "t2"], availableTimes: ["19:00"] };

function render(options: AvailableSeatingOption[] = [single], selected: AvailableSeatingOption | null = null, scene: GuestFloorplan | null = layout) {
  return renderToStaticMarkup(<FloorplanPicker floorplan={scene} floors={[{ id: floor.id, name: floor.name, tables: options }]} activeFloorId={floor.id} selected={selected} onFloorChange={() => {}} onSelect={() => {}} />);
}

describe("published floorplan picker", () => {
  it("draws saved table positions, rotation, scale, chairs, plants and named zones", () => {
    const html = render();
    expect(html).toContain('aria-label="The Cedar Room floor plan"');
    expect(html).toContain('translate(180 220) rotate(30) scale(1.2 1)');
    expect(html).toContain('translate(0 34) rotate(180)');
    expect(html).toContain('circle r="22"');
    expect(html).toContain('fill="#a6b69a"');
    expect(html).toContain('Garden Dining');
    expect(html).not.toContain("illustrative");
  });

  it("makes only available tables keyboard selectable and keeps unavailable tables visible", () => {
    const html = render();
    expect(html).toContain('role="button" tabindex="0" aria-pressed="false" aria-label="G01, available"');
    expect(html).toContain('role="img" aria-label="G02, not available at this time"');
    expect(html).not.toContain('aria-label="PL01, available"');
  });

  it("highlights both members of a selected combination even if either can also be booked alone", () => {
    const html = render([single, combo], combo);
    expect((html.match(/role="button" tabindex="0" aria-pressed="true"/g) || [])).toHaveLength(2);
  });

  it("shows the saved floorplan when none of its tables are available", () => {
    const html = render([]);
    expect(html).toContain('aria-label="The Cedar Room floor plan"');
    expect(html).toContain("No tables match your party and time");
    expect(html).not.toContain('class="wl-floorplan-table"');
  });

  it("does not allow stale availability, inactive tables or fixtures to be selected", () => {
    const inactive = { ...layout, floors: [{ ...floor, tables: floor.tables.map((item) => item.id === "t1" ? { ...item, isActive: false } : item) }] };
    const html = render([single, { ...single, id: "stale", tableIds: ["old-published-id"] }, { ...single, id: "plant-option", tableIds: ["plant"] }], null, inactive);
    expect(html).not.toContain('class="wl-floorplan-table"');
    expect(html).toContain("No tables match your party and time");
  });

  it("uses a plain accessible table list if no layout has been published", () => {
    const html = render([single], null, null);
    expect(html).toContain("A floorplan is not published");
    expect(html).toContain("G01");
    expect(html).not.toContain("<svg");
  });
});
