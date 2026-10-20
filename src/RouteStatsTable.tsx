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

import { useGetRouteStats } from "./api/symbanta.ts";
import type { V1RouteStatsResponse } from "./api/model";
import { usePeriod } from "./PeriodContext.tsx";
import {
  Card,
  CardHeader,
  cardPaddingClass,
  DateRangeBadge,
  EmptyState,
  ErrorState,
  RouteIcon,
  type StatRow,
  StatsTable,
  TableSkeleton,
} from "./ui.tsx";

interface RouteStatsTableProps {
  domain?: string;
  className?: string;
}

export function RouteStatsTable({ domain = "localhost", className }: RouteStatsTableProps) {
  const { period } = usePeriod();
  const { data, isLoading, isError, error } = useGetRouteStats({ domain, period });

  const response = data?.data as V1RouteStatsResponse | undefined;
  const rows: StatRow[] = (response?.items ?? []).map((item) => ({
    // A route stripped down to an empty string is the site root.
    label: item.route === "" ? "/" : (item.route ?? "Unknown"),
    pageViews: item.pageViews ?? 0,
    visitors: item.visitors ?? 0,
  }));

  const from = response?.from ? new Date(response.from) : undefined;
  const to = response?.to ? new Date(response.to) : undefined;

  const errObj = error as { detail?: string; title?: string; message?: string } | null;
  const errorMessage =
    errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";

  return (
    <Card className={className}>
      <div className={cardPaddingClass}>
        <CardHeader
          title="Top routes"
          domain={domain}
          icon={<RouteIcon className="h-4.5 w-4.5" />}
          action={from && to ? <DateRangeBadge from={from} to={to} /> : null}
        />

        {isLoading ? (
          <TableSkeleton />
        ) : isError ? (
          <ErrorState title="Could not load routes" message={errorMessage} />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<RouteIcon className="h-5 w-5" />}
            title="No route data available"
            description={
              <>
                No route records found for{" "}
                <span className="font-medium text-stone-700 dark:text-stone-300">{domain}</span> in
                this timeframe.
              </>
            }
          />
        ) : (
          <StatsTable rows={rows} labelHeader="Route" emptyLabel="/" />
        )}
      </div>
    </Card>
  );
}
