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

import { useState } from "react";
import { useGetStatsSummary } from "./api/symbanta.ts";
import {
  formatDuration,
  formattedDate,
  getCookie,
  periodLabels,
  type PeriodType,
  roundToTwoPlaces,
  setCookie,
} from "./Prelude.ts";
import { Period, type V1StatsSummaryResponse } from "./api/model";

const PERIOD_COOKIE_KEY = "symbanta_selected_period";

interface StatsDashboardProps {
  domain?: string;
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="flex flex-col justify-between p-4 sm:p-5 bg-stone-50/80 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800 min-w-0 transition-all">
      <span className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 mb-1.5 truncate">
        {title}
      </span>
      <div className="w-full overflow-hidden">
        <span
          className="block text-xl sm:text-2xl xl:text-3xl font-bold text-stone-800 dark:text-stone-100 whitespace-nowrap truncate tracking-tight"
          title={String(value)}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

export function StatsDashboard({ domain = "localhost" }: StatsDashboardProps) {
  const [period, setPeriodState] = useState<PeriodType>(() => {
    const cookiePeriod = getCookie(PERIOD_COOKIE_KEY) as PeriodType;
    return Object.values(Period).includes(cookiePeriod as Period)
      ? cookiePeriod
      : Period.LAST_7_DAYS;
  });

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriodState(newPeriod);
    setCookie(PERIOD_COOKIE_KEY, newPeriod);
  };

  const { data, isLoading, isError, error } = useGetStatsSummary({ domain, period });

  if (isLoading) {
    return (
      <div className="p-8 text-stone-500 dark:text-stone-400 text-center animate-pulse">
        Gathering leaves... (Loading analytics)
      </div>
    );
  }

  if (isError) {
    const errObj = error as { detail?: string; title?: string; message?: string };
    const errorMessage =
      errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";
    return (
      <div className="p-8 text-rose-300 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 rounded-3xl border border-transparent dark:border-rose-900/50">
        Error loading stats: {errorMessage}
      </div>
    );
  }

  const stats = data?.data as V1StatsSummaryResponse | undefined;
  const pageViews = stats?.pageViews ?? 0;
  const visitors = stats?.visitors ?? 0;
  const bounceRate = stats?.bounceRate ?? 0;
  const averageDurationSeconds = stats?.averageDurationMillis
    ? stats.averageDurationMillis / 1000
    : 0;

  const from = stats?.from ? new Date(stats.from) : new Date();
  const to = stats?.to ? new Date(stats.to) : new Date();

  const hasNoData = !stats || (pageViews === 0 && visitors === 0);

  return (
    <div className="w-full bg-white dark:bg-stone-900/60 p-5 sm:p-8 rounded-3xl shadow-sm border border-stone-200/60 dark:border-stone-800">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 flex-wrap">
          Overview for
          <span className="text-stone-100 bg-pink-400 dark:bg-pink-400 px-3 py-1 rounded-xl text-md border border-rose-100 dark:border-pink-500/30">
            {domain}
          </span>
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
            className="text-sm font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-3 py-1.5 rounded-xl border border-stone-200/80 dark:border-stone-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20 dark:focus:ring-rose-400/20"
          >
            {Object.values(Period)
              .filter((p) => p !== Period.CUSTOM)
              .map((p) => (
                <option
                  key={p}
                  value={p}
                  className="bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-200"
                >
                  {periodLabels[p]}
                </option>
              ))}
          </select>

          <div className="text-xs sm:text-sm font-medium text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-3.5 sm:px-4 py-1.5 rounded-full flex items-center gap-2">
            <span>🗓</span> {formattedDate(from)}{" "}
            <span className="text-stone-300 dark:text-stone-600">—</span> {formattedDate(to)}
          </div>
        </div>
      </div>

      {hasNoData ? (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center p-6 border border-dashed border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50/50 dark:bg-stone-900/30">
          <div className="w-12 h-12 mb-3 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 flex items-center justify-center text-stone-400 dark:text-stone-500 shadow-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
            No summary data available
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs leading-relaxed">
            No traffic activity recorded for{" "}
            <span className="font-medium text-stone-700 dark:text-stone-300">{domain}</span> in this
            timeframe.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Page Views" value={pageViews.toLocaleString()} />
          <StatCard title="Unique Visitors" value={visitors.toLocaleString()} />
          <StatCard title="Avg. Visit" value={formatDuration(averageDurationSeconds)} />
          <StatCard title="Bounce Rate" value={`${roundToTwoPlaces(bounceRate)}%`} />
        </div>
      )}
    </div>
  );
}
