import React, { useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import type { HourlyPoint } from '../types/vayunex';

interface AqiTrajectoryChartProps {
  hourly: HourlyPoint[];
  accentColor: string;
  bestHour: string;
  bestAqi: number;
  worstHour: string;
  worstAqi: number;
}

/**
 * Interactive 24-hour AQI SVG trajectory chart with dynamic Y-axis scaling and hover tooltip.
 */
export const AqiTrajectoryChart: React.FC<AqiTrajectoryChartProps> = ({
  hourly,
  accentColor,
  bestHour,
  bestAqi,
  worstHour,
  worstAqi,
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartW = 680;
  const chartH = 200;
  const padL = 36;
  const padR = 16;
  const padT = 18;
  const padB = 24;

  const { yMin, yMax, yTicks, points, linePath, areaPath } = useMemo(() => {
    const rawMin = Math.min(...hourly.map((h) => h.aqi));
    const rawMax = Math.max(...hourly.map((h) => h.aqi));
    const minVal = Math.max(0, Math.floor((rawMin - 15) / 10) * 10);
    const maxVal = Math.max(minVal + 40, Math.ceil((rawMax + 15) / 10) * 10);

    const pts = hourly.map((pt, i) => {
      const x =
        padL + (i / Math.max(1, hourly.length - 1)) * (chartW - padL - padR);
      const ratio = (pt.aqi - minVal) / Math.max(1, maxVal - minVal);
      const y = chartH - padB - ratio * (chartH - padT - padB);
      return { x, y, pt };
    });

    const lPath = pts
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');
    const aPath = `${lPath} L ${pts[pts.length - 1]?.x.toFixed(1) ?? padL} ${
      chartH - padB
    } L ${padL} ${chartH - padB} Z`;

    return {
      yMin: minVal,
      yMax: maxVal,
      yTicks: [minVal, Math.round((minVal + maxVal) / 2), maxVal],
      points: pts,
      linePath: lPath,
      areaPath: aPath,
    };
  }, [hourly]);

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="lg:col-span-7 flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-bold text-slate-900">
            24-Hour AQI Trajectory
          </h2>
          <p className="text-xs text-slate-500">
            Hourly forecast highlighting the cleanest daytime window for errands and ventilation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800">
            <Clock className="h-3.5 w-3.5" />
            Best Daytime: {bestHour} ({bestAqi})
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 font-semibold text-rose-800">
            Peak: {worstHour} ({worstAqi})
          </span>
        </div>
      </div>

      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${chartW} ${chartH}`}
          role="img"
          aria-label={`24-hour AQI trajectory. Best daytime hour ${bestHour} at AQI ${bestAqi}, peak hour ${worstHour} at AQI ${worstAqi}.`}
          className="h-52 w-full overflow-visible"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="aqiArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={accentColor} stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {yTicks.map((val) => {
            const ratio = (val - yMin) / Math.max(1, yMax - yMin);
            const y = chartH - padB - ratio * (chartH - padT - padB);
            return (
              <g key={val}>
                <line
                  x1={padL}
                  x2={chartW - padR}
                  y1={y}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={padL - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 text-[10px] font-medium"
                >
                  {val}
                </text>
              </g>
            );
          })}

          <path d={areaPath} fill="url(#aqiArea)" />
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {activePoint && (
            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={padT}
              y2={chartH - padB}
              stroke="#94a3b8"
              strokeDasharray="3 3"
            />
          )}

          {points.map((p, idx) => (
            <g key={p.pt.hourLabel}>
              <circle
                cx={p.x}
                cy={p.y}
                r={hoveredIdx === idx ? 5 : 2.5}
                fill={hoveredIdx === idx ? '#0f172a' : accentColor}
                stroke="#ffffff"
                strokeWidth={hoveredIdx === idx ? 2 : 0}
              />
              <rect
                x={p.x - 12}
                y={0}
                width={24}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
              />
              {(idx % 4 === 0 || idx === points.length - 1) && (
                <text
                  x={p.x}
                  y={chartH - 4}
                  textAnchor="middle"
                  className="fill-slate-400 text-[10px] font-medium"
                >
                  {p.pt.hourLabel}
                </text>
              )}
            </g>
          ))}
        </svg>

        {activePoint && (
          <div
            className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-lg border border-slate-200 bg-slate-900 px-3 py-1.5 text-[11px] text-white shadow-md whitespace-nowrap"
            style={{
              left: `${Math.min(84, Math.max(16, (activePoint.x / chartW) * 100))}%`,
            }}
          >
            <span className="font-semibold">{activePoint.pt.hourLabel}</span>
            <span className="mx-1.5 text-slate-400">|</span>
            <span className="font-mono-num">
              AQI {activePoint.pt.aqi} • PM2.5 {activePoint.pt.pm25} µg/m³
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
