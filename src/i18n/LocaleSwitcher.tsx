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
