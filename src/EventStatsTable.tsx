// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useGetEventStats } from "./api/symbanta.ts";
import type { V1EventStatsResponse } from "./api/model";
import { usePeriod } from "./PeriodContext.tsx";
import { errorMessage } from "./Prelude.ts";
import { useI18n } from "./i18n/I18nContext.tsx";
import {
  Card,
  CardHeader,
  cardPaddingClass,
  DateRangeBadge,
  EmptyState,
  ErrorState,
  type StatRow,
  StatsTable,
  TableSkeleton,
  TagIcon,
} from "./ui.tsx";

interface EventStatsTableProps {
  domain?: string;
  className?: string;
}

/**
 * Occurrences per event name, including the free-form business events an
 * instrumented application emits (`signup-click`, `checkout`, ...) alongside
 * `page-view`.
 */
export function EventStatsTable({ domain = "localhost", className }: EventStatsTableProps) {
  const { t } = useI18n();
  const { period } = usePeriod();
  const { data, isLoading, isError, error } = useGetEventStats({ domain, period });

  const response = data?.data as V1EventStatsResponse | undefined;
  const rows: StatRow[] = (response?.items ?? []).map((item) => ({
    label: item.eventName || "Unknown",
    pageViews: item.occurrences ?? 0,
    visitors: item.visitors ?? 0,
  }));

  const from = response?.from ? new Date(response.from) : undefined;
  const to = response?.to ? new Date(response.to) : undefined;

  return (
    <Card className={className}>
      <div className={cardPaddingClass}>
        <CardHeader
          title={t("Events")}
          domain={domain}
          icon={<TagIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState
            title={t("Could not load events")}
            message={errorMessage(error, t("An unknown error occurred"))}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<TagIcon className="h-5 w-5" />}
            title={t("No events recorded")}
            description={t("No events found for {domain} in this timeframe.", { domain })}
          />
        ) : (
          <StatsTable
            rows={rows}
            labelHeader={t("Event")}
            viewsHeader={t("Occurrences")}
            emptyLabel={t("Unknown")}
          />
        )}
      </div>
    </Card>
  );
}
