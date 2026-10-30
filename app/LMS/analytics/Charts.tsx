"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import type { DailyPoint } from "types/analyticsTypes";
import { formatCompact, formatCount, formatDay, formatDayLong } from "./format";
import {
  AxisText,
  ChartFrame,
  Legend,
  LegendItem,
  LineKey,
  Tooltip,
  TooltipRow,
  TooltipTitle,
} from "./style";

/**
 * Small hand-drawn SVG charts for the analytics dashboard. Two charts don't
 * justify a charting library; these follow the house rules instead: thin
 * marks, one axis, recessive grid, a hover/focus readout that never holds
 * the only copy of a value (the page has a table view of every number).
 */

const HEIGHT = 220;
const MARGIN = { top: 8, right: 12, bottom: 24, left: 40 };
const TICKS = 4;

/** A round step so the y-axis reads 0 / 5 / 10 / 15, never 0 / 3.7 / 7.4. */
const niceStep = (raw: number) => {
  if (raw <= 1) return 1;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 && pow > 1 ? 2.5 : n <= 5 ? 5 : 10;
  return step * pow;
};

const yScale = (max: number) => {
  const step = niceStep(max / TICKS);
  const top = step * TICKS;
  return { top, ticks: Array.from({ length: TICKS + 1 }, (_, i) => i * step) };
};

/** About six date labels, always including the last day. */
const labelIndices = (count: number) => {
  const step = Math.max(1, Math.ceil(count / 6));
  const indices: number[] = [];
  for (let i = count - 1; i >= 0; i -= step) indices.push(i);
  return indices;
};

/**
 * Width tracking, the active (hovered or focused) day, and keyboard stepping.
 * Starts at a typical width so the server render has sane geometry; the
 * observer corrects it on the first frame.
 */
const useChart = (count: number) => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(720);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width)))
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const last = count - 1;
      const next =
        event.key === "ArrowLeft"
          ? Math.max(0, (active ?? last) - 1)
          : event.key === "ArrowRight"
            ? Math.min(last, (active ?? last) + 1)
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? last
                : null;
      if (next === null) return;
      event.preventDefault();
      setActive(next);
    },
    [active, count]
  );

  return {
    width,
    active,
    setActive,
    // The frame is what is focused and labelled; the SVG inside is hidden
    // from assistive tech so the chart isn't announced twice.
    frameProps: {
      ref,
      role: "group",
      tabIndex: 0,
      onKeyDown,
      onFocus: () => setActive((current) => current ?? count - 1),
      onBlur: () => setActive(null),
      onPointerLeave: () => setActive(null),
    },
  };
};

/** The tooltip sits beside the crosshair, flipping to the left near the edge. */
const tooltipStyle = (x: number, width: number) =>
  x > width - 180
    ? { left: x, transform: "translateX(calc(-100% - 12px))" }
    : { left: x, transform: "translateX(12px)" };

const XAxis = ({
  points,
  xOf,
  width,
}: {
  points: DailyPoint[];
  xOf: (i: number) => number;
  width: number;
}) => (
  <>
    {labelIndices(points.length).map((i) => {
      const x = xOf(i);
      const anchor =
        x < MARGIN.left + 24 ? "start" : x > width - MARGIN.right - 24 ? "end" : "middle";
      return (
        <AxisText key={points[i].day} x={x} y={HEIGHT - 6} textAnchor={anchor}>
          {formatDay(points[i].day)}
        </AxisText>
      );
    })}
  </>
);

const Grid = ({ ticks, yOf, width }: { ticks: number[]; yOf: (v: number) => number; width: number }) => (
  <>
    {ticks.map((tick) => (
      <g key={tick}>
        <line
          x1={MARGIN.left}
          x2={width - MARGIN.right}
          y1={yOf(tick)}
          y2={yOf(tick)}
          stroke="var(--primary-black-10)"
          strokeWidth={1}
          shapeRendering="crispEdges"
        />
        <AxisText x={MARGIN.left - 8} y={yOf(tick) + 4} textAnchor="end">
          {formatCompact(tick)}
        </AxisText>
      </g>
    ))}
  </>
);

export type LineSeries = {
  key: "visitors" | "views";
  label: string;
  color: string;
  /** A 10% wash under the line, so the two series differ by more than hue. */
  area?: boolean;
};

/** Visitors and page views per day, on one count axis. */
export const TrendChart = ({
  points,
  series,
  summary,
}: {
  points: DailyPoint[];
  series: LineSeries[];
  /** What a screen reader hears for the whole chart. */
  summary: string;
}) => {
  const { width, active, setActive, frameProps } = useChart(points.length);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const max = Math.max(0, ...points.flatMap((p) => series.map((s) => p[s.key])));
  const { top, ticks } = yScale(max);

  const xOf = (i: number) =>
    MARGIN.left + (points.length === 1 ? plotWidth / 2 : (i * plotWidth) / (points.length - 1));
  const yOf = (value: number) => MARGIN.top + plotHeight - (value / top) * plotHeight;
  const baseline = yOf(0);

  const onPointerMove = (event: PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - box.left) / box.width;
    setActive(Math.round(Math.min(1, Math.max(0, ratio)) * (points.length - 1)));
  };

  const activePoint = active !== null ? points[active] : null;

  return (
    <div>
      <Legend>
        {series.map((s) => (
          <LegendItem key={s.key}>
            <LineKey $color={s.color} aria-hidden="true" />
            {s.label}
          </LegendItem>
        ))}
      </Legend>
      <ChartFrame {...frameProps} aria-label={`${summary} Use the arrow keys to read each day.`}>
        <svg width={width} height={HEIGHT} aria-hidden="true">
          <Grid ticks={ticks} yOf={yOf} width={width} />
          <XAxis points={points} xOf={xOf} width={width} />

          {series.map((s) => {
            const line = points
              .map((p, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(p[s.key])}`)
              .join(" ");
            return (
              <g key={s.key}>
                {s.area && points.length > 1 && (
                  <path
                    d={`${line} L${xOf(points.length - 1)},${baseline} L${xOf(0)},${baseline} Z`}
                    fill={s.color}
                    fillOpacity={0.1}
                  />
                )}
                <path
                  d={line}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </g>
            );
          })}

          {active !== null && (
            <g aria-hidden="true">
              <line
                x1={xOf(active)}
                x2={xOf(active)}
                y1={MARGIN.top}
                y2={baseline}
                stroke="var(--primary-black-30)"
                strokeWidth={1}
              />
              {series.map((s) => (
                <circle
                  key={s.key}
                  cx={xOf(active)}
                  cy={yOf(points[active][s.key])}
                  r={4}
                  fill={s.color}
                  stroke="var(--primary-white)"
                  strokeWidth={2}
                />
              ))}
            </g>
          )}

          {/* The whole plot is the hit target: readers aim at a date, not a line. */}
          <rect
            x={MARGIN.left}
            y={MARGIN.top}
            width={plotWidth}
            height={plotHeight}
            fill="transparent"
            onPointerMove={onPointerMove}
          />
        </svg>

        {activePoint && active !== null && (
          <Tooltip style={tooltipStyle(xOf(active), width)} role="status" aria-live="polite">
            <TooltipTitle>{formatDayLong(activePoint.day)}</TooltipTitle>
            {series.map((s) => (
              <TooltipRow key={s.key}>
                <LineKey $color={s.color} aria-hidden="true" />
                <strong>{formatCount(activePoint[s.key])}</strong>
                <span>{s.label.toLowerCase()}</span>
              </TooltipRow>
            ))}
          </Tooltip>
        )}
      </ChartFrame>
    </div>
  );
};

/** Path for a column with rounded data-end and a square foot on the baseline. */
const columnPath = (x: number, y: number, w: number, base: number) => {
  const r = Math.min(4, w / 2, base - y);
  return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${base} Z`;
};

/** One series per day as columns: crawler fetches. */
export const ColumnChart = ({
  points,
  valueKey,
  label,
  color,
  summary,
}: {
  points: DailyPoint[];
  valueKey: "crawlerHits";
  label: string;
  color: string;
  summary: string;
}) => {
  const { width, active, setActive, frameProps } = useChart(points.length);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const { top, ticks } = yScale(Math.max(0, ...points.map((p) => p[valueKey])));

  const band = plotWidth / points.length;
  // Capped at 24px and never touching: the 2px between columns is surface.
  const barWidth = Math.max(1, Math.min(24, band - 2));
  const xOf = (i: number) => MARGIN.left + i * band + band / 2;
  const yOf = (value: number) => MARGIN.top + plotHeight - (value / top) * plotHeight;
  const baseline = yOf(0);

  const activePoint = active !== null ? points[active] : null;

  return (
    <ChartFrame {...frameProps} aria-label={`${summary} Use the arrow keys to read each day.`}>
      <svg width={width} height={HEIGHT} aria-hidden="true">
        <Grid ticks={ticks} yOf={yOf} width={width} />
        <XAxis points={points} xOf={xOf} width={width} />

        {points.map((p, i) => {
          const value = p[valueKey];
          const x = xOf(i) - barWidth / 2;
          return (
            <g key={p.day}>
              {value > 0 && (
                <path
                  d={columnPath(x, yOf(value), barWidth, baseline)}
                  fill={color}
                  fillOpacity={active === null || active === i ? 1 : 0.55}
                />
              )}
              {/* Hit target: the whole band, full height, not just the bar. */}
              <rect
                x={MARGIN.left + i * band}
                y={MARGIN.top}
                width={band}
                height={plotHeight}
                fill="transparent"
                onPointerEnter={() => setActive(i)}
              />
            </g>
          );
        })}
      </svg>

      {activePoint && active !== null && (
        <Tooltip style={tooltipStyle(xOf(active), width)} role="status" aria-live="polite">
          <TooltipTitle>{formatDayLong(activePoint.day)}</TooltipTitle>
          <TooltipRow>
            <LineKey $color={color} aria-hidden="true" />
            <strong>{formatCount(activePoint[valueKey])}</strong>
            <span>{label.toLowerCase()}</span>
          </TooltipRow>
        </Tooltip>
      )}
    </ChartFrame>
  );
};
