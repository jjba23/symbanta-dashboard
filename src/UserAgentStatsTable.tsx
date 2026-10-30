// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useGetUserAgentStats } from "./api/symbanta.ts";
import type { V1UserAgentStatsResponse } from "./api/model";
import { usePeriod } from "./PeriodContext.tsx";
import { errorMessage } from "./Prelude.ts";
import { useI18n } from "./i18n/I18nContext.tsx";
import {
  BrowserIcon,
  Card,
  CardHeader,
  cardPaddingClass,
  DateRangeBadge,
  EmptyState,
  ErrorState,
  type StatRow,
  StatsTable,
  TableSkeleton,
} from "./ui.tsx";

interface UserAgentStatsTableProps {
  domain?: string;
  className?: string;
}

export function UserAgentStatsTable({ domain = "localhost", className }: UserAgentStatsTableProps) {
  const { t } = useI18n();
  const { period } = usePeriod();
  const { data, isLoading, isError, error } = useGetUserAgentStats({ domain, period });

  const response = data?.data as V1UserAgentStatsResponse | undefined;
  const rows: StatRow[] = (response?.items ?? []).map((item) => ({
    label: item.userAgent ?? "Unknown",
    pageViews: item.pageViews ?? 0,
    visitors: item.visitors ?? 0,
  }));

  const from = response?.from ? new Date(response.from) : undefined;
  const to = response?.to ? new Date(response.to) : undefined;

  return (
    <Card className={className}>
      <div className={cardPaddingClass}>
        <CardHeader
          title={t("User agents")}
          domain={domain}
          icon={<BrowserIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState
            title={t("Could not load user agents")}
            message={errorMessage(error, t("An unknown error occurred"))}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<BrowserIcon className="h-5 w-5" />}
            title={t("No user agent data available")}
            description={t("No user agent records found for {domain} in this timeframe.", {
              domain,
            })}
          />
        ) : (
          <StatsTable rows={rows} labelHeader={t("User agent")} emptyLabel={t("Unknown")} />
        )}
      </div>
    </Card>
  );
}
