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

import { useGetCountryStats } from "./api/symbanta.ts";
import type { V1CountryStatsResponse } from "./api/model";
import { usePeriod } from "./PeriodContext.tsx";
import { errorMessage } from "./Prelude.ts";
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
          title="Countries"
          domain={domain}
          icon={<GlobeIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState title="Could not load countries" message={errorMessage(error)} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<GlobeIcon className="h-5 w-5" />}
            title="No country data available"
            description={
              <>
                No visitors with a resolvable country for{" "}
                <span className="font-medium text-stone-700 dark:text-stone-300">{domain}</span> in
                this timeframe.
              </>
            }
          />
        ) : (
          <StatsTable rows={rows} labelHeader="Country" />
        )}
      </div>
    </Card>
  );
}
