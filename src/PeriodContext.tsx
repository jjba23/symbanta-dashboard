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

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { Period } from "./api/model";
import { getCookie, setCookie, type PeriodType } from "./Prelude.ts";

const PERIOD_COOKIE_KEY = "symbanta_selected_period";

interface PeriodContextValue {
  period: PeriodType;
  setPeriod: (period: PeriodType) => void;
}

const PeriodContext = createContext<PeriodContextValue | undefined>(undefined);

function readInitialPeriod(): PeriodType {
  const cookiePeriod = getCookie(PERIOD_COOKIE_KEY) as PeriodType;
  return Object.values(Period).includes(cookiePeriod as Period) ? cookiePeriod : Period.LAST_7_DAYS;
}

/**
 * Holds the selected reporting period for the whole dashboard so that every
 * card (summary, time series and tables) stays in sync.
 */
export function PeriodProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<PeriodType>(readInitialPeriod);

  const value = useMemo<PeriodContextValue>(
    () => ({
      period,
      setPeriod: (nextPeriod: PeriodType) => {
        setPeriodState(nextPeriod);
        setCookie(PERIOD_COOKIE_KEY, nextPeriod);
      },
    }),
    [period],
  );

  return <PeriodContext.Provider value={value}>{children}</PeriodContext.Provider>;
}

export function usePeriod(): PeriodContextValue {
  const context = useContext(PeriodContext);
  if (!context) {
    throw new Error("usePeriod must be used within a PeriodProvider");
  }
  return context;
}
