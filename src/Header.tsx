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

import { ThemeToggle } from "./ThemeToggle.tsx";
import { UserDetails } from "./UserDetails.tsx";
import { DomainSwitcher } from "./DomainSwitcher.tsx";
import { ContrastToggle } from "./a11y/ContrastToggle.tsx";
import { LocaleSwitcher } from "./i18n/LocaleSwitcher.tsx";
import { useI18n } from "./i18n/I18nContext.tsx";

interface HeaderProps {
  selectedDomain?: string;
  onSelectDomain?: (domain: string) => void;
}

/** Frosted title bar: app icon, wordmark and the global controls. */
function Header({ selectedDomain = "", onSelectDomain }: HeaderProps) {
  const { t } = useI18n();

  return (
    <header className="glass glass-toolbar flex flex-col gap-3.5 rounded-[1.25rem] px-3.5 py-3 sm:gap-4 sm:rounded-[1.5rem] sm:px-4 sm:py-3.5 lg:flex-row lg:items-center lg:justify-between">
      <a
        href="/"
        aria-label={t("symbanta — go to the analytics dashboard")}
        className="group flex min-w-0 items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
      >
        <span className="glass-inset flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 ease-[var(--ease-spring)] group-hover:scale-[1.03] sm:h-11 sm:w-11">
          <img
            src="https://jointhefreeworld.org/static-assets/symbanta/symbanta-small.png"
            alt=""
            className="h-7 w-7 object-contain sm:h-8 sm:w-8"
          />
        </span>
        <span className="min-w-0">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50">
              symbanta
            </span>
            <span
              aria-hidden="true"
              className="hidden shrink-0 text-xs font-medium text-stone-500 sm:inline dark:text-stone-400"
            >
              Συμβάντα
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[11px] text-stone-600 sm:text-xs dark:text-stone-400">
            {t("Your privacy-friendly cozy analytics dashboard.")}
          </span>
        </span>
      </a>

      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <UserDetails />
        {onSelectDomain && (
          <DomainSwitcher onSelectDomain={onSelectDomain} selectedDomain={selectedDomain} />
        )}
        <LocaleSwitcher />
        <ContrastToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
