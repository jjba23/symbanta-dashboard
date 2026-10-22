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

import { useEffect, useRef, useState } from "react";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { periodLabel } from "./i18n/periods.ts";
import { usePeriod } from "./PeriodContext.tsx";
import { RefreshIcon, Spinner, controlClass, PeriodSelect } from "./ui.tsx";
import { useI18n } from "./i18n/I18nContext.tsx";

/**
 * Global filter bar for the dashboard: a single period selector drives every
 * panel, plus a refresh action for the current domain/period.
 *
 * Refresh progress is announced through a polite live region instead of only
 * changing the button label, so screen-reader users learn when the data has
 * settled without their focus moving.
 */
export function DashboardToolbar() {
  const { period, setPeriod } = usePeriod();
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching() > 0;

  const [announcement, setAnnouncement] = useState("");
  const wasFetching = useRef(false);

  useEffect(() => {
    if (isFetching) {
      wasFetching.current = true;
      return;
    }

    if (wasFetching.current) {
      wasFetching.current = false;
      setAnnouncement(
        t("Analytics updated at {time}", {
          time: new Date().toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }),
      );
    }
    // The live region tracks an async transition (network → idle), which is
    // exactly what an effect is for; the linter assumes derived state.
    // oxlint-disable-next-line react/set-state-in-effect
  }, [isFetching, t]);

  const liveMessage = isFetching ? t("Refreshing analytics…") : announcement;

  return (
    <div
      role="group"
      aria-label={t("Reporting filters")}
      className="glass glass-toolbar sticky top-3 z-30 flex flex-col gap-3 rounded-[1.15rem] px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between sm:rounded-[1.35rem] sm:px-4"
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <span
          aria-hidden="true"
          className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase sm:text-[11px] dark:text-stone-400"
        >
          {t("Period")}
        </span>
        <PeriodSelect value={period} onChange={setPeriod} className="min-w-0 flex-1 sm:flex-none" />
        <span className="hidden truncate text-xs text-stone-600 lg:inline dark:text-stone-400">
          {periodLabel(period, t)}
        </span>
      </div>

      <div className="flex items-center gap-2 self-stretch sm:self-auto">
        <p role="status" aria-live="polite" className="sr-only">
          {liveMessage}
        </p>
        <button
          type="button"
          onClick={() => queryClient.invalidateQueries()}
          disabled={isFetching}
          aria-busy={isFetching}
          className={`${controlClass} inline-flex flex-1 items-center justify-center gap-1.5 disabled:opacity-60 sm:flex-none`}
        >
          {isFetching ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <RefreshIcon className="h-3.5 w-3.5" />
          )}
          <span>{isFetching ? t("Refreshing…") : t("Refresh")}</span>
        </button>
      </div>
    </div>
  );
}
