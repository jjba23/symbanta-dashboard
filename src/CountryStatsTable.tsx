// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useGetCountryStats } from "./api/symbanta.ts";
import type { V1CountryStatsResponse } from "./api/model";
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
  GlobeIcon,
  type StatRow,
  StatsTable,
  TableSkeleton,
} from "./ui.tsx";

interface CountryStatsTableProps {
  domain?: string;
  className?: string;
}

const regionNames = (() => {
  try {
    return new Intl.DisplayNames(undefined, { type: "region" });
  } catch {
    return undefined;
  }
})();

/** "NL" -> "Netherlands (NL)", with the API's "ZZ" placeholder meaning unknown. */
function countryLabel(code: string): string {
  const normalized = (code || "ZZ").toUpperCase();
  if (normalized === "ZZ") return "Unknown";

  return `${regionNames?.of(normalized) ?? normalized} (${normalized})`;
}

export function CountryStatsTable({ domain = "localhost", className }: CountryStatsTableProps) {
  const { t } = useI18n();
  const { period } = usePeriod();
  const { data, isLoading, isError, error } = useGetCountryStats({ domain, period });

  const response = data?.data as V1CountryStatsResponse | undefined;
  const rows: StatRow[] = (response?.items ?? []).map((item) => ({
    label: countryLabel(item.country),
    pageViews: item.pageViews ?? 0,
    visitors: item.visitors ?? 0,
  }));

  const from = response?.from ? new Date(response.from) : undefined;
  const to = response?.to ? new Date(response.to) : undefined;

  return (
    <Card className={className}>
      <div className={cardPaddingClass}>
        <CardHeader
          title={t("Countries")}
          domain={domain}
          icon={<GlobeIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState
            title={t("Could not load countries")}
            message={errorMessage(error, t("An unknown error occurred"))}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<GlobeIcon className="h-5 w-5" />}
            title={t("No country data available")}
            description={t(
              "No visitors with a resolvable country for {domain} in this timeframe.",
              { domain },
            )}
          />
        ) : (
          <StatsTable rows={rows} labelHeader={t("Country")} emptyLabel={t("Unknown")} />
        )}
      </div>
    </Card>
  );
}
