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
import { useGetScreenSizeStats } from "./api/symbanta.ts";
import { formattedDate, getCookie, periodLabels, type PeriodType, setCookie } from "./Prelude.ts";
import { Period, type V1ScreenSizeStat, type V1ScreenSizeStatsResponse } from "./api/model";

const PERIOD_COOKIE_KEY = "symbanta_selected_period";

interface ScreenSizeStatsTableProps {
  domain?: string;
  limit?: number;
}

export function ScreenSizeStatsTable({ domain = "localhost" }: ScreenSizeStatsTableProps) {
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

  const { data, isLoading, isError, error } = useGetScreenSizeStats({ domain, period });

  if (isLoading) {
    return (
      <div className="p-8 text-stone-500 dark:text-stone-400 text-center animate-pulse">
        Gathering screen sizes... (Loading analytics)
      </div>
    );
  }

  if (isError) {
    const errObj = error as { detail?: string; title?: string; message?: string };
    const errorMessage =
      errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";
    return (
      <div className="p-8 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-transparent dark:border-rose-900/50 rounded-3xl">
        Error loading screen size stats: {errorMessage}
      </div>
    );
  }

  const response = data?.data as V1ScreenSizeStatsResponse | undefined;
  const items: V1ScreenSizeStat[] = response?.items ?? [];

  const from = response?.from ? new Date(response.from) : new Date();
  const to = response?.to ? new Date(response.to) : new Date();

  const totalPageViews = items.reduce((acc, curr) => acc + (curr.pageViews ?? 0), 0);
  const hasNoData = items.length === 0;

  return (
    <div className="w-full bg-white dark:bg-stone-900/60 p-5 sm:p-8 rounded-3xl shadow-sm border border-stone-200/60 dark:border-stone-800 max-h-120 overflow-y-auto">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <h2 className="text-xl font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2 flex-wrap">
          Screen Sizes for
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
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-stone-800 dark:text-stone-200 mb-1">
            No screen size data available
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs leading-relaxed">
            No screen size records found for{" "}
            <span className="font-medium text-stone-700 dark:text-stone-300">{domain}</span> in this
            timeframe.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-800 text-xs font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 bg-stone-50/50 dark:bg-stone-900/40">
                <th className="py-3 px-4 rounded-l-xl">Resolution</th>
                <th className="py-3 px-4 text-right">Page Views</th>
                <th className="py-3 px-4 text-right">Visitors</th>
                <th className="py-3 px-4 text-right rounded-r-xl w-32">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 text-sm">
              {items.map((item, index) => {
                const views = item.pageViews ?? 0;
                const percentage =
                  totalPageViews > 0 ? ((views / totalPageViews) * 100).toFixed(1) : "0.0";
                const resolutionLabel = item.size
                  ? `${item.size}`
                  : (item as any).size
                    ? `${(item as any).size}`
                    : "Unknown";

                return (
                  <tr
                    key={index}
                    className="hover:bg-stone-50/80 dark:hover:bg-stone-800/40 transition-colors group text-stone-700 dark:text-stone-300"
                  >
                    <td
                      className="py-3.5 px-4 font-mono text-xs max-w-md truncate"
                      title={resolutionLabel}
                    >
                      <span className="font-medium text-stone-800 dark:text-stone-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                        {resolutionLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-stone-800 dark:text-stone-200 whitespace-nowrap">
                      {views.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-stone-600 dark:text-stone-400 whitespace-nowrap">
                      {(item.visitors ?? 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-stone-100 dark:bg-stone-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-rose-500 dark:bg-rose-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium min-w-[36px]">
                          {percentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
