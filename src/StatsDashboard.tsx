// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import type { ReactNode } from "react";
import { useGetStatsSummary } from "./api/symbanta.ts";
import { errorMessage, formatDuration, roundToTwoPlaces } from "./Prelude.ts";
import type { V1StatsSummaryResponse } from "./api/model";
import { usePeriod } from "./PeriodContext.tsx";
import { useI18n } from "./i18n/I18nContext.tsx";
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
    <div className="glass-inset glass-lift group relative flex min-w-0 flex-col justify-between overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ring-1 ring-white/60 ring-inset ${accent}`}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span className="truncate text-xs font-medium text-stone-500 sm:text-[13px] dark:text-stone-400">
          {title}
        </span>
      </div>
      <span
        className="block truncate text-xl font-semibold tracking-tight tabular-nums text-stone-900 sm:text-2xl xl:text-3xl dark:text-stone-50"
        title={String(value)}
      >
        {value}
      </span>
    </div>
  );
}

export function StatsDashboard({ domain = "localhost" }: StatsDashboardProps) {
  const { period } = usePeriod();
  const { t, locale } = useI18n();
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

  return (
    <Card>
      <div className={cardPaddingClass}>
        <CardHeader
          title={t("Overview")}
          domain={domain}
          subtitle={t("Traffic highlights for the selected period")}
          icon={<ChartIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <StatsSkeleton />
        ) : isError ? (
          <ErrorState
            title={t("Could not load the overview")}
            message={errorMessage(error, t("An unknown error occurred"))}
          />
        ) : hasNoData ? (
          <EmptyState
            icon={<ChartIcon className="h-5 w-5" />}
            title={t("No summary data available")}
            description={t("No traffic activity recorded for {domain} in this timeframe.", {
              domain,
            })}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              title={t("Page Views")}
              value={pageViews.toLocaleString(locale)}
              icon={<EyeIcon className="h-4 w-4" />}
              accent="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300"
            />
            <StatCard
              title={t("Unique Visitors")}
              value={visitors.toLocaleString(locale)}
              icon={<UsersIcon className="h-4 w-4" />}
              accent="bg-pink-100 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300"
            />
            <StatCard
              title={t("Avg. Visit")}
              value={formatDuration(averageDurationSeconds)}
              icon={<ClockIcon className="h-4 w-4" />}
              accent="bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300"
            />
            <StatCard
              title={t("Bounce Rate")}
              value={`${roundToTwoPlaces(bounceRate)}%`}
              icon={<BounceIcon className="h-4 w-4" />}
              accent="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            />
          </div>
        )}
      </div>
    </Card>
  );
}
