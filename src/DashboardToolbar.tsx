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

import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { periodLabels } from "./Prelude.ts";
import { usePeriod } from "./PeriodContext.tsx";
import { RefreshIcon, Spinner, controlClass, PeriodSelect } from "./ui.tsx";

/**
 * Global filter bar for the dashboard: a single period selector drives every
 * panel, plus a refresh action for the current domain/period.
 */
export function DashboardToolbar() {
  const { period, setPeriod } = usePeriod();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  return (
    <div className="glass glass-toolbar sticky top-3 z-30 flex flex-col gap-3 rounded-2xl px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span className="text-[10px] font-semibold tracking-wider text-stone-400 uppercase sm:text-[11px] dark:text-stone-500">
          Period
        </span>
        <PeriodSelect value={period} onChange={setPeriod} className="min-w-0 flex-1 sm:flex-none" />
        <span className="hidden truncate text-xs text-stone-400 lg:inline dark:text-stone-500">
          {periodLabels[period]}
        </span>
      </div>

      <button
        type="button"
        onClick={() => queryClient.invalidateQueries()}
        disabled={isFetching}
        aria-busy={isFetching}
        className={`${controlClass} inline-flex items-center justify-center gap-1.5 self-stretch disabled:opacity-60 sm:self-auto`}
      >
        {isFetching ? <Spinner className="h-3.5 w-3.5" /> : <RefreshIcon className="h-3.5 w-3.5" />}
        <span>{isFetching ? "Refreshing…" : "Refresh"}</span>
      </button>
    </div>
  );
}
