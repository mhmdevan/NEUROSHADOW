"use client";

import { useId, useState } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleLinear, scalePoint } from "@visx/scale";
import { LinePath, AreaClosed } from "@visx/shape";
import { curveMonotoneX } from "@visx/curve";
import { LinearGradient } from "@visx/gradient";
import { AxisBottom, AxisLeft } from "@visx/axis";
import type { WeeklyTrendPoint } from "@/lib/weeklyTrends";
import { LOW_SIGNAL_QUALITY, FAIR_SIGNAL_QUALITY } from "@/lib/cognitiveModel";
import { useLanguage } from "./LanguageProvider";

export type TrendSeries = "signalQuality" | "focus" | "stability";

type SignalTrendChartProps = {
  points: WeeklyTrendPoint[];
  series: TrendSeries;
  reducedMotion: boolean;
};

const HEIGHT = 220;
const MARGIN = { top: 16, right: 16, bottom: 28, left: 32 } as const;

function valueOf(point: WeeklyTrendPoint, series: TrendSeries): number | null {
  return point[series];
}

function bandKey(value: number): "low" | "fair" | "good" {
  if (value < LOW_SIGNAL_QUALITY) return "low";
  if (value < FAIR_SIGNAL_QUALITY) return "fair";
  return "good";
}

type ChartInnerProps = SignalTrendChartProps & { width: number };

function ChartInner({ width, points, series, reducedMotion }: ChartInnerProps) {
  const { t } = useLanguage();
  const rawId = useId().replace(/[:]/g, "");
  const [active, setActive] = useState<number | null>(null);

  const innerW = Math.max(10, width - MARGIN.left - MARGIN.right);
  const innerH = HEIGHT - MARGIN.top - MARGIN.bottom;
  const compact = width < 380;

  const x = scalePoint<string>({
    domain: points.map((_, index) => String(index)),
    range: [0, innerW],
    padding: 0.5,
  });
  const y = scaleLinear<number>({ domain: [0, 100], range: [innerH, 0] });

  const cx = (index: number) => x(String(index)) ?? 0;
  const isDefined = (point: WeeklyTrendPoint) => valueOf(point, series) !== null;

  const bands = [
    { from: 0, to: LOW_SIGNAL_QUALITY, cls: "is-low" },
    { from: LOW_SIGNAL_QUALITY, to: FAIR_SIGNAL_QUALITY, cls: "is-fair" },
    { from: FAIR_SIGNAL_QUALITY, to: 100, cls: "is-good" },
  ] as const;

  const activePoint = active !== null ? points[active] : null;
  const activeValue = activePoint ? valueOf(activePoint, series) : null;

  // Tooltip position (inside the relatively-positioned wrapper).
  const tipLeft = active !== null ? MARGIN.left + cx(active) : 0;
  const tipTop = activeValue !== null ? MARGIN.top + y(activeValue) : MARGIN.top + innerH;

  const seriesLabel = t.weeklyTrends.series[series === "signalQuality" ? "signal" : series];

  return (
    <div className="signal-trend">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`${seriesLabel} — ${t.weeklyTrends.signalTrend}`}
        onMouseLeave={() => setActive(null)}
      >
        <defs>
          <LinearGradient id={`${rawId}-stroke`} from="#28e7ff" to="#ff4fd8" vertical={false}>
            <stop offset="0%" stopColor="#28e7ff" />
            <stop offset="50%" stopColor="#9c6dff" />
            <stop offset="100%" stopColor="#ff4fd8" />
          </LinearGradient>
          <LinearGradient
            id={`${rawId}-fill`}
            from="#28e7ff"
            to="#ff4fd8"
            fromOpacity={0.32}
            toOpacity={0}
            vertical
          />
        </defs>

        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {/* Threshold bands from the cognitive model (35 / 65). */}
          {bands.map((band) => (
            <rect
              key={band.cls}
              className={`signal-trend__band ${band.cls}`}
              x={0}
              width={innerW}
              y={y(band.to)}
              height={Math.max(0, y(band.from) - y(band.to))}
            />
          ))}

          {/* Gridlines at 0/25/50/75/100. */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <line key={tick} className="signal-trend__grid" x1={0} x2={innerW} y1={y(tick)} y2={y(tick)} />
          ))}

          <AxisLeft
            scale={y}
            tickValues={[0, 50, 100]}
            hideAxisLine
            hideTicks
            tickLabelProps={() => ({
              fill: "#7f93a9",
              fontSize: 10,
              fontWeight: 700,
              dx: -6,
              dy: 3,
              textAnchor: "end",
            })}
          />
          <AxisBottom
            scale={x}
            top={innerH}
            hideAxisLine
            hideTicks
            tickFormat={(value) => {
              const index = Number(value);
              if (compact && index % 2 !== 0) return "";
              return points[index]?.label ?? "";
            }}
            tickLabelProps={() => ({
              fill: "#7f93a9",
              fontSize: 10,
              fontWeight: 700,
              dy: 2,
              textAnchor: "middle",
            })}
          />

          <AreaClosed<WeeklyTrendPoint>
            data={points}
            x={(_, index) => cx(index)}
            y={(point) => y(valueOf(point, series) ?? 0)}
            yScale={y}
            curve={curveMonotoneX}
            defined={isDefined}
            fill={`url(#${rawId}-fill)`}
            className="signal-trend__area"
          />

          <LinePath<WeeklyTrendPoint>
            data={points}
            x={(_, index) => cx(index)}
            y={(point) => y(valueOf(point, series) ?? 0)}
            curve={curveMonotoneX}
            defined={isDefined}
          >
            {({ path }) => (
              <path
                d={path(points) || ""}
                pathLength={1}
                className={`signal-trend__line${reducedMotion ? "" : " is-draw"}`}
                stroke={`url(#${rawId}-stroke)`}
              />
            )}
          </LinePath>

          {/* Crosshair on the active day. */}
          {active !== null ? (
            <line className="signal-trend__crosshair" x1={cx(active)} x2={cx(active)} y1={0} y2={innerH} />
          ) : null}

          {/* Markers: filled dots for days with data, hollow rings on the baseline for gaps. */}
          {points.map((point, index) => {
            const value = valueOf(point, series);
            const isActive = active === index;
            if (value === null) {
              return (
                <g key={point.date}>
                  <circle className="signal-trend__gap" cx={cx(index)} cy={innerH} r={isActive ? 4 : 3} />
                  <circle
                    className="signal-trend__hit"
                    cx={cx(index)}
                    cy={innerH}
                    r={14}
                    tabIndex={0}
                    role="img"
                    aria-label={`${point.label}: ${t.weeklyTrends.noSession}`}
                    onMouseEnter={() => setActive(index)}
                    onFocus={() => setActive(index)}
                    onBlur={() => setActive(null)}
                  />
                </g>
              );
            }
            return (
              <g key={point.date}>
                <circle className="signal-trend__dot-glow" cx={cx(index)} cy={y(value)} r={isActive ? 9 : 6} />
                <circle className="signal-trend__dot" cx={cx(index)} cy={y(value)} r={isActive ? 3.6 : 2.6} />
                <circle
                  className="signal-trend__hit"
                  cx={cx(index)}
                  cy={y(value)}
                  r={14}
                  tabIndex={0}
                  role="img"
                  aria-label={`${point.label}: ${value}% ${seriesLabel}, ${t.weeklyTrends.bands[bandKey(value)]}`}
                  onMouseEnter={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
        </g>
      </svg>

      {active !== null && activePoint ? (
        <div
          className="signal-trend__tooltip"
          style={{ left: tipLeft, top: tipTop }}
          role="status"
        >
          <span className="signal-trend__tooltip-date">{activePoint.label}</span>
          {activeValue !== null ? (
            <strong>
              {activeValue}% · {t.weeklyTrends.bands[bandKey(activeValue)]}
            </strong>
          ) : (
            <strong className="signal-trend__tooltip-gap">{t.weeklyTrends.noSession}</strong>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function SignalTrendChart(props: SignalTrendChartProps) {
  return (
    <div className="signal-trend-wrap">
      <ParentSize debounceTime={16}>{({ width }) => (width > 0 ? <ChartInner width={width} {...props} /> : null)}</ParentSize>
    </div>
  );
}
