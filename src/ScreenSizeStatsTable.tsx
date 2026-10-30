// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useGetScreenSizeStats } from "./api/symbanta.ts";
import type { V1ScreenSizeStatsResponse } from "./api/model";
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
  MonitorIcon,
  type StatRow,
  StatsTable,
  TableSkeleton,
} from "./ui.tsx";

interface ScreenSizeStatsTableProps {
  domain?: string;
  className?: string;
}

export function ScreenSizeStatsTable({
  domain = "localhost",
  className,
}: ScreenSizeStatsTableProps) {
  const { t } = useI18n();
  const { period } = usePeriod();
  const { data, isLoading, isError, error } = useGetScreenSizeStats({ domain, period });

  const response = data?.data as V1ScreenSizeStatsResponse | undefined;
  const rows: StatRow[] = (response?.items ?? []).map((item) => ({
    label: item.size ? `${item.size}` : "Unknown",
    pageViews: item.pageViews ?? 0,
    visitors: item.visitors ?? 0,
  }));

  const from = response?.from ? new Date(response.from) : undefined;
  const to = response?.to ? new Date(response.to) : undefined;

  return (
    <Card className={className}>
      <div className={cardPaddingClass}>
        <CardHeader
          title={t("Screen sizes")}
          domain={domain}
          icon={<MonitorIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState
            title={t("Could not load screen sizes")}
            message={errorMessage(error, t("An unknown error occurred"))}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<MonitorIcon className="h-5 w-5" />}
            title={t("No screen size data available")}
            description={t("No screen size records found for {domain} in this timeframe.", {
              domain,
            })}
          />
        ) : (
          <StatsTable rows={rows} labelHeader={t("Resolution")} emptyLabel={t("Unknown")} />
        )}
      </div>
    </Card>
  );
}
