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

import { useContrast } from "./ContrastContext.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";

/**
 * Toggle for the "Increase contrast" material set.
 *
 * It is a toggle button (`aria-pressed`), so its accessible name stays stable
 * — screen readers announce the state change, not a moving label.
 */
export function ContrastToggle() {
  const { resolvedContrast, setPreference } = useContrast();
  const { t } = useI18n();
  const isMore = resolvedContrast === "more";

  return (
    <button
      type="button"
      onClick={() => setPreference(isMore ? "system" : "more")}
      aria-pressed={isMore}
      aria-label={t("Increase contrast")}
      title={isMore ? t("Contrast: increased") : t("Contrast: standard")}
      className="glass-control inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-stone-700 transition-[background,box-shadow] focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-stone-200"
    >
      <svg
        className="h-4.5 w-4.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8.25" />
        <path d="M12 3.75a8.25 8.25 0 010 16.5V3.75z" fill="currentColor" stroke="none" />
      </svg>
    </button>
  );
}
