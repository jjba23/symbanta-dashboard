// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useEffect, useMemo } from "react";
import { useGetProperties } from "./api/symbanta";
import type { V1PropertiesResponse, V1Property } from "./api/model";
import { controlClass } from "./ui.tsx";
import { useI18n } from "./i18n/I18nContext.tsx";

interface DomainSwitcherProps {
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
}

export function DomainSwitcher({ selectedDomain, onSelectDomain }: DomainSwitcherProps) {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGetProperties();

  const propertiesResponse = data?.data as V1PropertiesResponse | undefined;
  const properties: V1Property[] = useMemo(
    () => propertiesResponse?.properties ?? [],
    [propertiesResponse?.properties],
  );

  const firstDomain = properties[0]?.domain;

  // Auto-select the first available domain if none is currently selected
  useEffect(() => {
    if (!selectedDomain && firstDomain) {
      onSelectDomain(firstDomain);
    }
  }, [selectedDomain, firstDomain, onSelectDomain]);

  if (isLoading) {
    return (
      <div className="glass-inset animate-pulse rounded-xl px-3 py-2 text-xs text-stone-500 dark:text-stone-400">
        {t("Loading properties…")}
      </div>
    );
  }

  if (isError || properties.length === 0) {
    return (
      <div className="flex min-w-0 items-center gap-1.5">
        <label
          htmlFor="domain-input"
          className="shrink-0 text-[11px] font-semibold text-stone-500 dark:text-stone-400"
        >
          {t("Domain")}
        </label>
        <input
          id="domain-input"
          type="text"
          value={selectedDomain}
          onChange={(e) => onSelectDomain(e.target.value)}
          placeholder={t("Enter domain…")}
          className={`${controlClass} w-32 min-w-0 px-2.5 sm:w-48`}
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <label
        htmlFor="domain-select"
        className="shrink-0 text-[11px] font-semibold text-stone-500 dark:text-stone-400"
      >
        {t("Property")}
      </label>
      <select
        id="domain-select"
        value={selectedDomain}
        onChange={(e) => onSelectDomain(e.target.value)}
        className={`${controlClass} max-w-[11rem] min-w-0 truncate px-2.5 sm:max-w-xs`}
      >
        {properties.map((prop) => (
          <option
            key={prop.id}
            value={prop.domain}
            className="bg-white text-stone-800 dark:bg-stone-800 dark:text-stone-200"
          >
            {prop.domain}
          </option>
        ))}
      </select>
    </div>
  );
}
