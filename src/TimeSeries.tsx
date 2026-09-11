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

import {useState} from "react";
import {useGetTimeSeriesStats} from "./api/symbanta.ts";
import {GetTimeSeriesStatsPeriod, type V1TimeSeriesStatsResponse} from "./api/model";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

type PeriodType = (typeof GetTimeSeriesStatsPeriod)[keyof typeof GetTimeSeriesStatsPeriod];

const PERIOD_LABELS: Record<PeriodType, string> = {
    [GetTimeSeriesStatsPeriod.LAST_24_HOURS]: "Last 24 Hours",
    [GetTimeSeriesStatsPeriod.LAST_7_DAYS]: "Last 7 Days",
    [GetTimeSeriesStatsPeriod.LAST_30_DAYS]: "Last 30 Days",
    [GetTimeSeriesStatsPeriod.LAST_6_MONTHS]: "Last 6 Months",
    [GetTimeSeriesStatsPeriod.LAST_12_MONTHS]: "Last 12 Months",
    [GetTimeSeriesStatsPeriod.CUSTOM]: "Custom",
};

interface StatsDashboardProps {
    domain?: string;
}

// Custom polished tooltip component with backdrop blur
// @ts-ignore
const CustomTooltip = ({active, payload, label}: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div
                className="bg-white/95 backdrop-blur-md p-3.5 border border-stone-200/80 shadow-xl rounded-2xl text-xs font-medium min-w-40">
                <p className="text-stone-400 font-semibold mb-2 text-[11px] uppercase tracking-wider">
                    {label}
                </p>
                <div className="space-y-1.5">
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm"
                    style={{backgroundColor: entry.color}}
                />
                                <span className="text-stone-600 font-medium">{entry.name}</span>
                            </div>
                            <span className="font-bold text-stone-900 tabular-nums">
                {entry.value?.toLocaleString()}
              </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

export function TimeSeries({domain = "localhost"}: StatsDashboardProps) {
    const [period, setPeriod] = useState<PeriodType>(GetTimeSeriesStatsPeriod.LAST_7_DAYS);

    const {data, isLoading, isError, error} = useGetTimeSeriesStats({domain, period});

    if (isLoading) {
        return (
            <div className="p-8 text-stone-500 text-center animate-pulse font-medium">
                Loading time series...
            </div>
        );
    }

    if (isError) {
        const errObj = error as { detail?: string; title?: string; message?: string };
        const errorMessage =
            errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";
        return (
            <div className="p-8 text-rose-500 bg-rose-50 rounded-3xl border border-rose-100 font-medium">
                Error loading time series: {errorMessage}
            </div>
        );
    }

    const stats = data?.data as V1TimeSeriesStatsResponse | undefined;
    const points = stats?.points || [];

    const hasNoData =
        points.length === 0 || points.every((p) => (p.pageViews || 0) === 0 && (p.visitors || 0) === 0);

    const chartData = points.map((point) => {
        const date = new Date(point.timestamp);
        const formattedLabel =
            stats?.granularity === "DAY"
                ? date.toLocaleDateString(undefined, {month: "short", day: "numeric"})
                : date.toLocaleTimeString(undefined, {hour: "2-digit", minute: "2-digit"});
        return {...point, label: formattedLabel};
    });

    return (
        <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/60">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-stone-800 tracking-tight">Traffic Trends</h2>
                    <p className="text-xs text-stone-500 mt-0.5">
                        Overview of page views and unique visitors
                    </p>
                </div>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodType)}
                    className="text-xs font-semibold text-stone-700 bg-stone-100/80 hover:bg-stone-100 transition-colors px-3 py-2 rounded-xl border border-stone-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                >
                    {Object.values(GetTimeSeriesStatsPeriod)
                        .filter((p) => p !== GetTimeSeriesStatsPeriod.CUSTOM)
                        .map((p) => (
                            <option key={p} value={p}>
                                {PERIOD_LABELS[p]}
                            </option>
                        ))}
                </select>
            </div>

            {/* Render Empty State OR Chart */}
            {hasNoData ? (
                <div
                    className="w-full h-80 flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                    <div
                        className="w-12 h-12 mb-3 rounded-2xl bg-stone-100 border border-stone-200/60 flex items-center justify-center text-stone-400 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-stone-800 mb-1">No traffic recorded</h3>
                    <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                        There are no page views or unique visitors recorded for this time period.
                    </p>
                </div>
            ) : (
                <div className="w-full h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                            <defs>
                                <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35}/>
                                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0}/>
                                </linearGradient>
                                <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f472b6" stopOpacity={0.35}/>
                                    <stop offset="95%" stopColor="#f472b6" stopOpacity={0.0}/>
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>

                            <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: "#a8a29e", fontSize: 12}}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{fill: "#a8a29e", fontSize: 12}}
                                allowDecimals={false}
                            />

                            <Tooltip content={<CustomTooltip/>}/>

                            <Legend
                                position="top"
                                height={40}
                                iconType="circle"
                                wrapperStyle={{fontSize: "13px", fontWeight: 500, color: "#57534e"}}
                            />

                            <Area
                                type="monotone"
                                dataKey="pageViews"
                                name="Page Views"
                                stroke="#8b5cf6"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#pageViewsGradient)"
                                activeDot={{r: 6, strokeWidth: 2, stroke: "#ffffff"}}
                            />
                            <Area
                                type="monotone"
                                dataKey="visitors"
                                name="Unique Visitors"
                                stroke="#f472b6"
                                strokeWidth={2.5}
                                fillOpacity={1}
                                fill="url(#visitorsGradient)"
                                activeDot={{r: 6, strokeWidth: 2, stroke: "#ffffff"}}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
