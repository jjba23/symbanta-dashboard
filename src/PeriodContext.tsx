// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

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
