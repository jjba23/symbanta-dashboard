// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getCookie, setCookie } from "../Prelude.ts";

/**
 * Contrast preference, mirroring the macOS "Increase contrast" switch.
 *
 * `system` follows `prefers-contrast: more`; `more` forces the opaque,
 * high-contrast material set from `index.css` (`:root[data-contrast="more"]`).
 */
export type ContrastPreference = "system" | "more";
export type ResolvedContrast = "normal" | "more";

interface ContrastContextType {
  preference: ContrastPreference;
  setPreference: (preference: ContrastPreference) => void;
  resolvedContrast: ResolvedContrast;
}

const CONTRAST_COOKIE_KEY = "symbanta_contrast";
const MORE_CONTRAST_QUERY = "(prefers-contrast: more)";

const ContrastContext: React.Context<ContrastContextType | undefined> = createContext<
  ContrastContextType | undefined
>(undefined);

function readStoredPreference(): ContrastPreference {
  const stored = getCookie(CONTRAST_COOKIE_KEY);
  return stored === "more" ? "more" : "system";
}

export function ContrastProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ContrastPreference>(readStoredPreference);
  const [resolvedContrast, setResolvedContrast] = useState<ResolvedContrast>("normal");

  const setPreference = (next: ContrastPreference) => {
    setPreferenceState(next);
    setCookie(CONTRAST_COOKIE_KEY, next);
  };

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia(MORE_CONTRAST_QUERY);

    const apply = () => {
      const isMore = preference === "more" || mediaQuery.matches;

      root.dataset["contrast"] = isMore ? "more" : "normal";
      root.classList.toggle("contrast-more", isMore);
      setResolvedContrast(isMore ? "more" : "normal");
    };

    apply();
    mediaQuery.addEventListener("change", apply);

    return () => mediaQuery.removeEventListener("change", apply);
  }, [preference]);

  return (
    <ContrastContext.Provider value={{ preference, setPreference, resolvedContrast }}>
      {children}
    </ContrastContext.Provider>
  );
}

export function useContrast() {
  const context = useContext(ContrastContext);
  if (!context) {
    throw new Error("useContrast must be used within a ContrastProvider");
  }
  return context;
}
