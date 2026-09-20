import { useMemo, useRef, useState } from "react";
import type { AvailableFloor, AvailableSeatingOption } from "../../../white-label/types";
import { optionForTable, optionsByTableId } from "./availability";
import { FloorBackground, TableShape, ZoneShape } from "./geometry";
import { tableSize } from "./measure";
import type { FloorplanFloor, GuestFloorplan, TableState } from "./types";
import "./floorplan.css";

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

function useAvailability(floor: AvailableFloor | undefined) {
  return useMemo(() => optionsByTableId(floor?.tables ?? []), [floor]);
}

function describe(option: AvailableSeatingOption | undefined, label: string) {
  if (!option) return `${label}, not available at this time`;
  if (option.type === "COMBO")
    return `${option.name}, ${option.tableIds.length} tables joined together`;
  return `${option.name}, available`;
}

export default function FloorplanPicker({
  floorplan,
  floors,
  activeFloorId,
  selected,
  onFloorChange,
  onSelect,
}: {
  floorplan: GuestFloorplan | null;
  floors: AvailableFloor[];
  activeFloorId: string;
  selected: AvailableSeatingOption | null;
  onFloorChange: (floorId: string) => void;
  onSelect: (floorId: string, option: AvailableSeatingOption) => void;
}) {
  const activeAvailability =
    floors.find((floor) => floor.id === activeFloorId) ?? floors[0];
  const layout: FloorplanFloor | undefined = floorplan?.floors.find(
    (floor) => floor.id === activeAvailability?.id,
  );
  const byTableId = useAvailability(activeAvailability);
  const options = activeAvailability?.tables ?? [];

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<number | null>(null);

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  function stateFor(tableId: string, isFixture: boolean): TableState {
    if (isFixture) return "fixture";
    const option = optionForTable(byTableId.get(tableId) ?? []);
    if (!option) return "unavailable";
    if (selected?.id !== option.id) return "available";
    return option.tableIds.length > 1 ? "combo-member" : "selected";
  }

  // Pointer handling: a single finger selects until the guest zooms in, at
  // which point it pans instead. Without that the map would swallow ordinary
  // page scrolling on a phone.
  const panning = zoom > ZOOM_MIN;

  function onPointerDown(event: React.PointerEvent<SVGSVGElement>) {
    pointers.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }

  function onPointerMove(event: React.PointerEvent<SVGSVGElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);

    if (pointers.current.size === 2 && pinch.current !== null) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const factor = distance / pinch.current;
      pinch.current = distance;
      setZoom((current) =>
        Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, current * factor)),
      );
      return;
    }
    if (pointers.current.size === 1 && panning) {
      setPan((current) => ({
        x: current.x + (next.x - previous.x),
        y: current.y + (next.y - previous.y),
      }));
    }
  }

  function onPointerUp(event: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0 && zoom === ZOOM_MIN)
      setPan({ x: 0, y: 0 });
  }

  const choose = (option: AvailableSeatingOption) =>
    onSelect(activeAvailability?.id ?? "", option);

  return (
    <div className="wl-floorplan">
      {floors.length > 1 ? (
        <div className="wl-floor-tabs" role="tablist">
          {floors.map((floor) => (
            <button
              type="button"
              role="tab"
              key={floor.id}
              aria-selected={activeAvailability?.id === floor.id}
              className={activeAvailability?.id === floor.id ? "is-active" : ""}
              onClick={() => {
                reset();
                onFloorChange(floor.id);
              }}
            >
              {floor.name}
            </button>
          ))}
        </div>
      ) : null}

      {layout ? (
        <div className="wl-floorplan-stage">
          <svg
            viewBox={`-20 -20 ${layout.backgroundWidth + 40} ${layout.backgroundHeight + 40}`}
            role="group"
            aria-label={`${layout.name} floor plan`}
            style={{ touchAction: panning ? "none" : "pan-y" }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoom})`}>
              <FloorBackground floor={layout} />
              {layout.zones.map((zone) => (
                <ZoneShape key={zone.id} points={zone.polygonPoints} />
              ))}

              {/* A joined pair reads as one choice, so the link is drawn
                  beneath both tables before either is painted. */}
              {selected && selected.tableIds.length > 1
                ? (() => {
                    const members = selected.tableIds
                      .map((id) => layout.tables.find((t) => t.id === id))
                      .filter((t): t is NonNullable<typeof t> => Boolean(t));
                    if (members.length < 2) return null;
                    return (
                      <line
                        x1={members[0].x}
                        y1={members[0].y}
                        x2={members[1].x}
                        y2={members[1].y}
                        stroke="currentColor"
                        strokeWidth="6"
                        strokeLinecap="round"
                        opacity="0.45"
                      />
                    );
                  })()
                : null}

              {layout.tables.map((table) => {
                const isFixture = table.template.type === "fixture";
                const state = stateFor(table.id, isFixture);
                if (isFixture || state === "unavailable")
                  return (
                    <g key={table.id} aria-hidden="true">
                      <TableShape table={table} state={state} />
                    </g>
                  );
                const option = optionForTable(byTableId.get(table.id) ?? []);
                const { w, h } = tableSize(table.template);
                return (
                  <g
                    key={table.id}
                    className="wl-floorplan-table"
                    role="button"
                    tabIndex={0}
                    aria-pressed={state !== "available"}
                    aria-label={describe(option, table.label)}
                    onClick={() => option && choose(option)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter" && event.key !== " ") return;
                      event.preventDefault();
                      if (option) choose(option);
                    }}
                  >
                    <TableShape table={table} state={state} />
                    {/* A generous invisible target: a two-top is a small tap
                        area on a phone. */}
                    <rect
                      x={table.x - Math.max(w, 44) / 2}
                      y={table.y - Math.max(h, 44) / 2}
                      width={Math.max(w, 44)}
                      height={Math.max(h, 44)}
                      fill="transparent"
                    />
                  </g>
                );
              })}
            </g>
          </svg>
          <div className="wl-floorplan-zoom">
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(ZOOM_MAX, z + 0.5))}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(ZOOM_MIN, z - 0.5))}
            >
              −
            </button>
            <button type="button" aria-label="Reset view" onClick={reset}>
              ⟲
            </button>
          </div>
        </div>
      ) : null}

      {/*
       * The same tables as a list. This is the whole feature when the layout
       * has not loaded, the way through on a small screen, and the path for
       * anyone using a keyboard or screen reader.
       */}
      <ul className="wl-floorplan-list">
        {options.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className={selected?.id === option.id ? "is-selected" : ""}
              aria-pressed={selected?.id === option.id}
              onClick={() => choose(option)}
            >
              <strong>{option.name}</strong>
              <small>
                {option.type === "COMBO"
                  ? `${option.tableIds.length} tables joined`
                  : "Available"}
              </small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
