// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useI18n } from "./I18nContext.tsx";
import { GlobeIcon } from "../ui.tsx";

/**
 * Language picker for the title bar.
 *
 * Languages are listed by their endonym (never translated), each option
 * carries its own `lang` so screen readers switch pronunciation, and the
 * select keeps the glass-control look of the neighbouring toggles.
 */
export function LocaleSwitcher() {
  const { locale, locales, localeName, setLocale, t } = useI18n();
  const label = t("Language");

  return (
    <div className="glass-control inline-flex h-9 items-center gap-1.5 rounded-xl px-2">
      <GlobeIcon className="h-3.5 w-3.5 shrink-0 text-stone-500 dark:text-stone-400" />
      <select
        aria-label={label}
        title={label}
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="cursor-pointer bg-transparent text-xs font-medium text-stone-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-stone-200"
      >
        {locales.map((code) => (
          <option
            key={code}
            value={code}
            lang={code}
            className="bg-white text-stone-800 dark:bg-stone-800 dark:text-stone-200"
          >
            {localeName(code)}
          </option>
        ))}
      </select>
    </div>
  );
}
