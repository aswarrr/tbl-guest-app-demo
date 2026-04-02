import { useState, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  formatCompactNumber,
  formatPercent,
  type ChartDatum,
  type DashboardListItem,
  type DashboardTone,
} from "../../utils/dashboard";

export type DashboardMetric = {
  label: string;
  value: number | string;
  hint: string;
  tone?: DashboardTone;
};

const toneStyles: Record<DashboardTone, CSSProperties> = {
  default: {
    background: "#f8fafc",
    borderColor: "#e5e7eb",
    color: "#111827",
  },
  positive: {
    background: "#ecfdf5",
    borderColor: "#bbf7d0",
    color: "#065f46",
  },
  warning: {
    background: "#fffbeb",
    borderColor: "#fde68a",
    color: "#92400e",
  },
  danger: {
    background: "#fef2f2",
    borderColor: "#fecaca",
    color: "#991b1b",
  },
};

function formatMetricValue(value: number | string) {
  return typeof value === "number" ? formatCompactNumber(value) : value;
}

export function DashboardSectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="dashboard-section-heading">
      <div>
        <h2 className="dashboard-section-title">{title}</h2>
        {subtitle ? <p className="dashboard-section-subtitle">{subtitle}</p> : null}
      </div>

      {action ? <div>{action}</div> : null}
    </div>
  );
}

export function DashboardMetricCard({ metric }: { metric: DashboardMetric }) {
  const tone = metric.tone ?? "default";

  return (
    <section
      className="dashboard-metric-card"
      style={toneStyles[tone]}
    >
      <div className="dashboard-metric-label">{metric.label}</div>
      <div className="dashboard-metric-value">{formatMetricValue(metric.value)}</div>
      <div className="dashboard-metric-hint">{metric.hint}</div>
    </section>
  );
}

export function DashboardBarChartCard({
  title,
  subtitle,
  data,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  emptyText: string;
}) {
  const maxValue = Math.max(...data.map((entry) => entry.value), 0);
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  return (
    <section className="surface dashboard-card">
      <DashboardSectionHeading title={title} subtitle={subtitle} />

      {data.length === 0 || maxValue === 0 ? (
        <div className="dashboard-empty">{emptyText}</div>
      ) : (
        <div className="dashboard-bar-list">
          {data.map((entry) => (
            <div key={entry.label} className="dashboard-bar-item">
              <div className="dashboard-bar-copy">
                <span className="dashboard-bar-label">{entry.label}</span>
                <span className="dashboard-bar-hint">
                  {formatPercent(entry.value, total)}
                </span>
              </div>

              <div className="dashboard-bar-track">
                <div
                  className="dashboard-bar-fill"
                  style={{
                    width: `${Math.max((entry.value / maxValue) * 100, 8)}%`,
                    background: entry.color ?? "#2563eb",
                  }}
                />
              </div>

              <div className="dashboard-bar-value">{formatCompactNumber(entry.value)}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function DashboardDonutChartCard({
  title,
  subtitle,
  data,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  emptyText: string;
}) {
  const palette = ["#2563eb", "#0f766e", "#d97706", "#7c3aed", "#dc2626", "#475569"];
  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  let cursor = 0;
  const segments = data.map((entry, index) => {
    const color = entry.color ?? palette[index % palette.length];
    const size = total > 0 ? (entry.value / total) * 100 : 0;
    const segment = `${color} ${cursor}% ${cursor + size}%`;
    cursor += size;
    return { ...entry, color, segment };
  });

  const gradient =
    total > 0
      ? `conic-gradient(${segments.map((entry) => entry.segment).join(", ")})`
      : "#e5e7eb";

  return (
    <section className="surface dashboard-card">
      <DashboardSectionHeading title={title} subtitle={subtitle} />

      {data.length === 0 || total === 0 ? (
        <div className="dashboard-empty">{emptyText}</div>
      ) : (
        <div className="dashboard-donut-layout">
          <div className="dashboard-donut-wrap">
            <div
              className="dashboard-donut"
              style={{ background: gradient }}
            >
              <div className="dashboard-donut-center">
                <strong>{formatCompactNumber(total)}</strong>
                <span>Total</span>
              </div>
            </div>
          </div>

          <div className="dashboard-donut-legend">
            {segments.map((entry) => (
              <div key={entry.label} className="dashboard-donut-legend-item">
                <span
                  className="dashboard-donut-swatch"
                  style={{ background: entry.color }}
                />
                <div className="dashboard-donut-legend-copy">
                  <span>{entry.label}</span>
                  <span>{formatCompactNumber(entry.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function DashboardLineChartCard({
  title,
  subtitle,
  data,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  data: ChartDatum[];
  emptyText: string;
}) {
  const width = 640;
  const height = 220;
  const padding = 22;
  const maxValue = Math.max(...data.map((entry) => entry.value), 0);
  const [activePointIndex, setActivePointIndex] = useState<number | null>(null);

  const points = data.map((entry, index) => {
    const x =
      data.length === 1
        ? width / 2
        : padding + (index / (data.length - 1)) * (width - padding * 2);
    const y =
      maxValue === 0
        ? height - padding
        : height - padding - (entry.value / maxValue) * (height - padding * 2);
    return { x, y, label: entry.label, value: entry.value };
  });

  const activePoint =
    activePointIndex === null ? null : points[activePointIndex] ?? null;

  const hoverZones = points.map((point, index) => {
    const leftBoundary =
      index === 0 ? 0 : (points[index - 1]!.x + point.x) / 2;
    const rightBoundary =
      index === points.length - 1 ? width : (point.x + points[index + 1]!.x) / 2;

    return {
      x: leftBoundary,
      width: rightBoundary - leftBoundary,
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1]?.x ?? padding} ${height - padding} L ${
        points[0]?.x ?? padding
      } ${height - padding} Z`
    : "";

  return (
    <section className="surface dashboard-card">
      <DashboardSectionHeading title={title} subtitle={subtitle} />

      {data.length === 0 || maxValue === 0 ? (
        <div className="dashboard-empty">{emptyText}</div>
      ) : (
        <div className="dashboard-line-chart">
          <div
            className="dashboard-line-stage"
            onMouseLeave={() => setActivePointIndex(null)}
          >
            {activePoint ? (
              <div
                className="dashboard-line-tooltip"
                style={{
                  left: `${(activePoint.x / width) * 100}%`,
                  top: `${(activePoint.y / height) * 100}%`,
                }}
              >
                <strong>
                  {formatCompactNumber(activePoint.value)} reservation
                  {activePoint.value === 1 ? "" : "s"}
                </strong>
                <span>{activePoint.label}</span>
              </div>
            ) : null}

            <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
              <path
                d={areaPath}
                fill="rgba(37, 99, 235, 0.12)"
              />
              <path
                d={linePath}
                fill="none"
                stroke="#2563eb"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {activePoint ? (
                <line
                  className="dashboard-line-guide"
                  x1={activePoint.x}
                  y1={padding}
                  x2={activePoint.x}
                  y2={height - padding}
                />
              ) : null}

              {hoverZones.map((zone, index) => (
                <rect
                  key={`hover-zone-${points[index]?.label ?? index}`}
                  className="dashboard-line-hover-zone"
                  x={zone.x}
                  y={0}
                  width={zone.width}
                  height={height}
                  fill="transparent"
                  onMouseEnter={() => setActivePointIndex(index)}
                  onMouseMove={() => setActivePointIndex(index)}
                />
              ))}

              {points.map((point, index) => {
                const isActive = activePointIndex === index;

                return (
                  <g key={`${point.label}-${point.value}`}>
                    <circle
                      className="dashboard-line-point-hit"
                      cx={point.x}
                      cy={point.y}
                      r="14"
                      fill="transparent"
                      onMouseEnter={() => setActivePointIndex(index)}
                    />
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={isActive ? "6" : "4"}
                      fill={isActive ? "#2563eb" : "#ffffff"}
                      stroke="#2563eb"
                      strokeWidth={isActive ? "3" : "2"}
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="dashboard-line-labels">
            <span>{data[0]?.label}</span>
            <span>{data[Math.floor(data.length / 2)]?.label}</span>
            <span>{data[data.length - 1]?.label}</span>
          </div>
        </div>
      )}
    </section>
  );
}

export function DashboardListCard({
  title,
  subtitle,
  items,
  emptyText,
}: {
  title: string;
  subtitle?: string;
  items: DashboardListItem[];
  emptyText: string;
}) {
  return (
    <section className="surface dashboard-card">
      <DashboardSectionHeading title={title} subtitle={subtitle} />

      {items.length === 0 ? (
        <div className="dashboard-empty">{emptyText}</div>
      ) : (
        <div className="dashboard-list">
          {items.map((item, index) => {
            const content = (
              <div
                className="dashboard-list-item"
                style={item.tone ? toneStyles[item.tone] : undefined}
              >
                <div className="dashboard-list-copy">
                  <strong>{item.title}</strong>
                  {item.subtitle ? <span>{item.subtitle}</span> : null}
                </div>

                {item.meta ? <span className="dashboard-list-meta">{item.meta}</span> : null}
              </div>
            );

            if (!item.to) {
              return <div key={`${item.title}-${index}`}>{content}</div>;
            }

            return (
              <Link key={`${item.title}-${index}`} to={item.to}>
                {content}
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function DashboardActionCard({
  title,
  description,
  to,
}: {
  title: string;
  description: string;
  to: string;
}) {
  return (
    <Link className="dashboard-action-card" to={to}>
      <div className="dashboard-action-title">{title}</div>
      <div className="dashboard-action-description">{description}</div>
    </Link>
  );
}
