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
import {useGetStatsSummary} from "./api/symbanta.ts";
import {formatDuration, formattedDate, roundToTwoPlaces} from "./Prelude.ts";
import {GetStatsSummaryPeriod, type V1StatsSummaryResponse} from "./api/model";

type PeriodType = typeof GetStatsSummaryPeriod[keyof typeof GetStatsSummaryPeriod];

const PERIOD_LABELS: Record<PeriodType, string> = {
    [GetStatsSummaryPeriod.LAST_24_HOURS]: 'Last 24 Hours',
    [GetStatsSummaryPeriod.LAST_7_DAYS]: 'Last 7 Days',
    [GetStatsSummaryPeriod.LAST_30_DAYS]: 'Last 30 Days',
    [GetStatsSummaryPeriod.LAST_6_MONTHS]: 'Last 6 Months',
    [GetStatsSummaryPeriod.LAST_12_MONTHS]: 'Last 12 Months',
    [GetStatsSummaryPeriod.CUSTOM]: 'Custom',
};

interface StatsDashboardProps {
    domain?: string;
}

function StatCard({title, value}: { title: string; value: string | number }) {
    return (
        <div className="flex flex-col p-5 bg-stone-50/80 rounded-2xl border border-stone-100">
            <span className="text-sm font-medium text-stone-500 mb-1">{title}</span>
            <span className="text-3xl font-bold text-stone-800">{value}</span>
        </div>
    );
}

export function StatsDashboard({domain = "localhost"}: StatsDashboardProps) {
    const [period, setPeriod] = useState<PeriodType>(GetStatsSummaryPeriod.LAST_7_DAYS);

    // Pass fetch credentials so JSESSIONID cookie is sent with the request
    const {data, isLoading, isError, error} = useGetStatsSummary(
        {domain, period},
    );

    if (isLoading) {
        return (
            <div className="p-8 text-stone-500 text-center animate-pulse">
                Gathering leaves... (Loading analytics)
            </div>
        );
    }

    if (isError) {
        const errObj = error as { detail?: string; title?: string; message?: string };
        const errorMessage = errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";
        return (
            <div className="p-8 text-rose-500 bg-rose-50 rounded-3xl">
                Error loading stats: {errorMessage}
            </div>
        );
    }

    const stats = data?.data as V1StatsSummaryResponse | undefined;
    const pageViews = stats?.pageViews ?? 0;
    const visitors = stats?.visitors ?? 0;
    const bounceRate = stats?.bounceRate ?? 0;
    const averageDurationSeconds = stats?.averageDurationMillis ? stats.averageDurationMillis / 1000 : 0;

    const from = stats?.from ? new Date(stats.from) : new Date();
    const to = stats?.to ? new Date(stats.to) : new Date();

    const hasNoData = !stats || (pageViews === 0 && visitors === 0);

    return (
        <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    Overview for
                    <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-xl text-sm border border-rose-100">
                        {domain}
                    </span>
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as PeriodType)}
                        className="text-sm font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                        {Object.values(GetStatsSummaryPeriod)
                            .filter((p) => p !== GetStatsSummaryPeriod.CUSTOM)
                            .map((p) => (
                                <option key={p} value={p}>
                                    {PERIOD_LABELS[p]}
                                </option>
                            ))}
                    </select>

                    <div
                        className="text-sm font-medium text-stone-500 bg-stone-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <span>🗓</span> {formattedDate(from)} <span
                        className="text-stone-300">—</span> {formattedDate(to)}
                    </div>
                </div>
            </div>

            {hasNoData ? (
                <div
                    className="w-full py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-200 rounded-2xl bg-stone-50/50">
                    <div
                        className="w-12 h-12 mb-3 rounded-2xl bg-stone-100 border border-stone-200/60 flex items-center justify-center text-stone-400 shadow-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                  d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                                  d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"/>
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-stone-800 mb-1">No summary data available</h3>
                    <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                        No traffic activity recorded for <span className="font-medium text-stone-700">{domain}</span> in
                        this timeframe.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Page Views" value={pageViews.toLocaleString()}/>
                    <StatCard title="Unique Visitors" value={visitors.toLocaleString()}/>
                    <StatCard title="Avg. Visit" value={`${formatDuration(averageDurationSeconds)}`}/>
                    <StatCard title="Bounce Rate" value={`${roundToTwoPlaces(bounceRate)}%`}/>
                </div>
            )}
        </div>
    );
}
