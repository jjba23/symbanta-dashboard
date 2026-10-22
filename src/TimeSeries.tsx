/* symbanta-dashboard
 *
 * Copyright © Josep Bigorra <jjbigorra@gmail.com>
 *
 * symbanta-dashboard is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * symbanta-dashboard is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with symbanta-dashboard.  If not, see <https://www.gnu.org/licenses/>.
 */

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useGetTimeSeriesStats } from "./api/symbanta.ts";
import type { V1TimeSeriesStatsResponse } from "./api/model";
import { usePeriod } from "./PeriodContext.tsx";
import { useTheme } from "./ThemeContext.tsx";
import { usePrefersReducedMotion } from "./a11y/usePrefersReducedMotion.ts";
import { errorMessage } from "./Prelude.ts";
import { Card, CardHeader, cardPaddingClass, ChartIcon, EmptyState, ErrorState } from "./ui.tsx";

interface TimeSeriesProps {
  domain?: string;
}

interface TooltipEntry {
  name?: string | number;
  value?: string | number;
  color?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="glass-popover min-w-40 rounded-2xl p-3 text-xs font-medium">
      <p className="mb-2 text-[11px] font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shadow-sm ring-2 ring-white/80 dark:ring-stone-800"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-stone-600 dark:text-stone-300">{entry.name}</span>
            </div>
            <span className="font-bold tabular-nums text-stone-900 dark:text-stone-100">
              {typeof entry.value === "number" ? entry.value.toLocaleString() : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export function TimeSeries({ domain = "localhost" }: TimeSeriesProps) {
  const { period } = usePeriod();
  const { resolvedTheme } = useTheme();
  const reduceMotion = usePrefersReducedMotion();
  const { data, isLoading, isError, error } = useGetTimeSeriesStats({ domain, period });

  const stats = data?.data as V1TimeSeriesStatsResponse | undefined;
  const points = stats?.points ?? [];

  const hasNoData =
    points.length === 0 || points.every((p) => (p.pageViews || 0) === 0 && (p.visitors || 0) === 0);

  const chartData = points.map((point) => {
    const date = new Date(point.timestamp);
    const formattedLabel =
      stats?.granularity === "DAY"
        ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    return { ...point, label: formattedLabel };
  });

  // Recharts needs raw colour values for SVG attributes; derive them from the
  // *resolved* theme so the chart repaints when the user toggles light/dark.
  const isDarkMode = resolvedTheme === "dark";
  const gridColor = isDarkMode ? "rgba(255,255,255,0.07)" : "rgba(120,113,108,0.16)";
  const tickColor = isDarkMode ? "#a8a29e" : "#78716c"; // stone-400 vs stone-500
  const activeDotStroke = isDarkMode ? "#1c1917" : "#ffffff"; // stone-900 vs white
  const legendColor = isDarkMode ? "#e7e5e4" : "#57534e"; // stone-200 vs stone-600
  const cursorColor = isDarkMode ? "rgba(255,255,255,0.22)" : "rgba(120,113,108,0.3)";

  const pageViewsColor = isDarkMode ? "#a78bfa" : "#8b5cf6"; // violet-400 vs violet-500
  const visitorsColor = "#f472b6"; // pink-400

  return (
    <Card>
      <div className={cardPaddingClass}>
        <CardHeader
          title="Traffic Trends"
          subtitle="Page views and unique visitors over time"
          icon={<ChartIcon className="h-4.5 w-4.5" />}
        />

        {isLoading ? (
          <div
            className="glass-inset h-64 w-full animate-pulse rounded-2xl sm:h-80 lg:h-96"
            role="status"
            aria-live="polite"
          >
            <span className="sr-only">Loading time series…</span>
          </div>
        ) : isError ? (
          <ErrorState title="Could not load the time series" message={errorMessage(error)} />
        ) : hasNoData ? (
          <EmptyState
            icon={<ChartIcon className="h-5 w-5" />}
            title="No traffic recorded"
            description="There are no page views or unique visitors recorded for this time period."
          />
        ) : (
          <>
            <div
              role="img"
              aria-label={`Traffic trends chart: page views and unique visitors across ${chartData.length} time buckets. The same numbers are available in the table that follows.`}
              className="h-64 w-full sm:h-80 lg:h-96"
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
                initialDimension={{ width: 800, height: 320 }}
              >
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={pageViewsColor}
                        stopOpacity={isDarkMode ? 0.45 : 0.35}
                      />
                      <stop offset="95%" stopColor={pageViewsColor} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor={visitorsColor}
                        stopOpacity={isDarkMode ? 0.45 : 0.35}
                      />
                      <stop offset="95%" stopColor={visitorsColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />

                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickColor, fontSize: 11 }}
                    minTickGap={16}
                    interval="preserveStartEnd"
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: tickColor, fontSize: 11 }}
                    width={48}
                    allowDecimals={false}
                  />

                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: cursorColor, strokeWidth: 1, strokeDasharray: "4 4" }}
                  />

                  <Legend
                    verticalAlign="top"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px", fontWeight: 500, color: legendColor }}
                  />

                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke={pageViewsColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#pageViewsGradient)"
                    isAnimationActive={!reduceMotion}
                    animationDuration={600}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: activeDotStroke }}
                  />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    name="Unique Visitors"
                    stroke={visitorsColor}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#visitorsGradient)"
                    isAnimationActive={!reduceMotion}
                    animationDuration={600}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: activeDotStroke }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Screen-reader equivalent of the chart (WCAG 1.1.1): the same
                series as a real table, exposed only to assistive technology. */}
            {chartData.length > 0 && (
              <table className="sr-only">
                <caption>Traffic trends for the selected period</caption>
                <thead>
                  <tr>
                    <th scope="col">Time</th>
                    <th scope="col">Page views</th>
                    <th scope="col">Unique visitors</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((point) => (
                    <tr key={point.timestamp}>
                      <th scope="row">{point.label}</th>
                      <td>{point.pageViews}</td>
                      <td>{point.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
