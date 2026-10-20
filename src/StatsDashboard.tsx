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

import type { ReactNode } from "react";
import { useGetStatsSummary } from "./api/symbanta.ts";
import { formatDuration, roundToTwoPlaces } from "./Prelude.ts";
import type { V1StatsSummaryResponse } from "./api/model";
import { usePeriod } from "./PeriodContext.tsx";
import {
  BounceIcon,
  Card,
  CardHeader,
  cardPaddingClass,
  ChartIcon,
  ClockIcon,
  DateRangeBadge,
  EmptyState,
  ErrorState,
  EyeIcon,
  StatsSkeleton,
  UsersIcon,
} from "./ui.tsx";

interface StatsDashboardProps {
  domain?: string;
}

function StatCard({
  title,
  value,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: ReactNode;
  accent: string;
}) {
  return (
    <div className="group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl border border-stone-200/70 bg-stone-50/80 p-4 transition-colors hover:border-stone-300/80 sm:p-5 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:border-stone-700">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${accent}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="truncate text-xs font-medium text-stone-500 sm:text-[13px] dark:text-stone-400">
          {title}
        </span>
      </div>
      <span
        className="block truncate text-xl font-bold tracking-tight tabular-nums text-stone-800 sm:text-2xl xl:text-3xl dark:text-stone-100"
        title={String(value)}
      >
        {value}
      </span>
    </div>
  );
}

export function StatsDashboard({ domain = "localhost" }: StatsDashboardProps) {
  const { period } = usePeriod();
  const { data, isLoading, isError, error } = useGetStatsSummary({ domain, period });

  const stats = data?.data as V1StatsSummaryResponse | undefined;
  const pageViews = stats?.pageViews ?? 0;
  const visitors = stats?.visitors ?? 0;
  const bounceRate = stats?.bounceRate ?? 0;
  const averageDurationSeconds = stats?.averageDurationMillis
    ? stats.averageDurationMillis / 1000
    : 0;

  const from = stats?.from ? new Date(stats.from) : undefined;
  const to = stats?.to ? new Date(stats.to) : undefined;

  const hasNoData = !stats || (pageViews === 0 && visitors === 0);
  const errObj = error as { detail?: string; title?: string; message?: string } | null;
  const errorMessage =
    errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";

  return (
    <Card>
      <div className={cardPaddingClass}>
        <CardHeader
          title="Overview"
          domain={domain}
          subtitle="Traffic highlights for the selected period"
          icon={<ChartIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <StatsSkeleton />
        ) : isError ? (
          <ErrorState title="Could not load the overview" message={errorMessage} />
        ) : hasNoData ? (
          <EmptyState
            icon={<ChartIcon className="h-5 w-5" />}
            title="No summary data available"
            description={
              <>
                No traffic activity recorded for{" "}
                <span className="font-medium text-stone-700 dark:text-stone-300">{domain}</span> in
                this timeframe.
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              title="Page Views"
              value={pageViews.toLocaleString()}
              icon={<EyeIcon className="h-4 w-4" />}
              accent="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
            />
            <StatCard
              title="Unique Visitors"
              value={visitors.toLocaleString()}
              icon={<UsersIcon className="h-4 w-4" />}
              accent="bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300"
            />
            <StatCard
              title="Avg. Visit"
              value={formatDuration(averageDurationSeconds)}
              icon={<ClockIcon className="h-4 w-4" />}
              accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
            />
            <StatCard
              title="Bounce Rate"
              value={`${roundToTwoPlaces(bounceRate)}%`}
              icon={<BounceIcon className="h-4 w-4" />}
              accent="bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
