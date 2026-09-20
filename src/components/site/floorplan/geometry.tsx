import { memo, useState } from "react";
import { tableSize } from "./measure";
import type {
  FloorplanFloor,
  FloorplanTable,
  FloorplanTemplate,
  TableState,
} from "./types";

/**
 * Drawing primitives for the published floorplan, ported from the Workspace
 * floorplan editor so a guest sees the same room the restaurant laid out.
 *
 * The shape maths is deliberately identical: every object is drawn centred on
 * the origin and positioned by the parent transform, so rotation pivots about
 * a table's centre without any extra arithmetic.
 */

function Fixture({ type }: { type: FloorplanTemplate }) {
  const w = type.width,
    h = type.height;
  switch (type.fixtureKind) {
    case "wall":
      return (
        <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="1" fill="#485265" />
      );
    case "wall_corner":
      return (
        <path
          d={`M${-w / 2},${h / 2} V${-h / 2} H${w / 2}`}
          fill="none"
          stroke="#485265"
          strokeWidth="8"
        />
      );
    case "window":
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#e3edf0" />
          <path
            d={`M${-w / 2},-2 H${w / 2} M${-w / 2},2 H${w / 2}`}
            stroke="#8299a3"
          />
        </g>
      );
    case "door":
      return (
        <g fill="none">
          <path
            d={`M${-w / 2},${h / 2} V${h / 2 - w} M${-w / 2},${h / 2 - w} A${w},${w} 0 0 1 ${w / 2},${h / 2}`}
            stroke="#8c9199"
          />
          <path d={`M${-w / 2},${h / 2} H${w / 2}`} strokeWidth="3" />
        </g>
      );
    case "sliding_door":
      return (
        <g fill="none">
          <rect x={-w / 2} y={-h / 2} width={w} height={h} />
          <path d={`M${-w / 2},0 H0 V${h / 2} M0,${-h / 2} V0 H${w / 2}`} />
        </g>
      );
    case "plant":
    case "planter":
      return (
        <g fill="#a6b69a" stroke="#71846a">
          <rect
            x={-w / 2}
            y={-h / 2}
            width={w}
            height={h}
            rx={type.fixtureKind === "plant" ? Math.min(w, h) / 2 : 4}
            fill="#e6e4db"
          />
          {[0, 60, 120].map((r) => (
            <ellipse
              key={r}
              rx={w * 0.38}
              ry={h * 0.17}
              transform={`rotate(${r})`}
            />
          ))}
        </g>
      );
    case "stairs":
      return (
        <g fill="#eeeae1">
          <rect x={-w / 2} y={-h / 2} width={w} height={h} />
          {Array.from({ length: 7 }, (_, i) => (
            <path
              key={i}
              d={`M${-w / 2},${-h / 2 + ((i + 1) * h) / 8} H${w / 2}`}
            />
          ))}
        </g>
      );
    case "pillar":
      return type.shape === "circle" ? (
        <circle r={type.radius} fill="#b5b5b0" />
      ) : (
        <rect x={-w / 2} y={-h / 2} width={w} height={h} fill="#b5b5b0" />
      );
    default:
      return (
        <g>
          <rect x={-w / 2} y={-h / 2} width={w} height={h} rx="4" fill="#e9e5db" />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            stroke="none"
            fill="#586070"
            fontSize="9"
          >
            {type.fixtureKind === "restroom"
              ? "WC"
              : type.fixtureKind === "hostess"
                ? "HOST"
                : type.name}
          </text>
        </g>
      );
  }
}

const FILLS: Record<TableState, { fill: string; stroke: string }> = {
  available: { fill: "#faf5e9", stroke: "#92958e" },
  selected: { fill: "#ece4d4", stroke: "currentColor" },
  "combo-member": { fill: "#ece4d4", stroke: "currentColor" },
  unavailable: { fill: "#f0eee9", stroke: "#cdcbc5" },
  fixture: { fill: "#faf5e9", stroke: "#92958e" },
};

/**
 * One table, drawn in place.
 *
 * Chairs are drawn before the tabletop so the table overlaps them, which is
 * what makes a seat read as tucked under the edge.
 */
export const TableShape = memo(function TableShape({
  table,
  state,
}: {
  table: FloorplanTable;
  state: TableState;
}) {
  const type = table.template;
  const { w, h } = tableSize(type);
  const chosen = state === "selected" || state === "combo-member";
  const colors = FILLS[state];

  return (
    <g
      transform={`translate(${table.x} ${table.y}) rotate(${table.rotation}) scale(${table.scaleX} ${table.scaleY})`}
      opacity={state === "unavailable" ? 0.3 : state === "fixture" ? 0.55 : 1}
    >
      <g stroke={colors.stroke} strokeWidth={chosen ? 2 : 1.3}>
        {type.type === "fixture" ? (
          <Fixture type={type} />
        ) : (
          <>
            {type.chairs.map((chair) => (
              <g
                key={chair.id}
                transform={`translate(${chair.x} ${chair.y}) rotate(${chair.rotation})`}
              >
                <rect
                  x={-chair.width / 2}
                  y={-chair.depth / 2}
                  width={chair.width}
                  height={chair.depth}
                  rx="2.5"
                  fill="#e3dccd"
                />
                <path
                  d={`M${-chair.width / 2 + 2},${-chair.depth / 2 + 2} H${chair.width / 2 - 2}`}
                  stroke="#bab09d"
                />
              </g>
            ))}
            {type.shape === "circle" ? (
              <circle r={type.radius} fill={colors.fill} />
            ) : (
              <rect
                x={-w / 2}
                y={-h / 2}
                width={w}
                height={h}
                rx={type.type === "booth" ? 3 : 5}
                fill={colors.fill}
              />
            )}
          </>
        )}
      </g>
      {type.type !== "fixture" ? (
        <text
          textAnchor="middle"
          dominantBaseline="middle"
          fill={state === "unavailable" ? "#9b978f" : "#112349"}
          fontSize="11"
          fontWeight="600"
          pointerEvents="none"
        >
          {table.label}
        </text>
      ) : null}
      {chosen ? (
        // non-scaling-stroke keeps this a hairline at any zoom, so the ring
        // never swamps a small table.
        <rect
          x={-w / 2 - 5}
          y={-h / 2 - 5}
          width={w + 10}
          height={h + 10}
          rx="3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      ) : null}
    </g>
  );
});

function Background({ floor }: { floor: FloorplanFloor }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <rect
        width={floor.backgroundWidth}
        height={floor.backgroundHeight}
        fill="#fffdf8"
      />
      {floor.backgroundImageUrl && !failed ? (
        <image
          href={floor.backgroundImageUrl}
          width={floor.backgroundWidth}
          height={floor.backgroundHeight}
          preserveAspectRatio="none"
          onError={() => setFailed(true)}
        />
      ) : null}
    </>
  );
}

/** Keyed on the image so a floor change retries a previously failed load. */
export const FloorBackground = memo(function FloorBackground({
  floor,
}: {
  floor: FloorplanFloor;
}) {
  return <Background key={floor.backgroundImageUrl} floor={floor} />;
});

/** The soft outline of a named area, drawn under the tables. */
export function ZoneShape({
  points,
}: {
  points: Array<{ x: number; y: number }>;
}) {
  if (points.length < 3) return null;
  return (
    <polygon
      points={points.map((p) => `${p.x},${p.y}`).join(" ")}
      fill="#112349"
      fillOpacity=".055"
      stroke="#112349"
      strokeOpacity=".2"
    />
  );
}
