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

interface HeaderProps {
  selectedDomain?: string;
  onSelectDomain?: (domain: string) => void;
}

function Header({ selectedDomain = "", onSelectDomain }: HeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-stone-200/70 pb-5 sm:gap-5 sm:pb-6 lg:flex-row lg:items-center lg:justify-between dark:border-stone-800">
      <div className="min-w-0">
        <a
          href="/"
          className="inline-flex max-w-full items-center gap-2.5 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
        >
          <img
            src="https://jointhefreeworld.org/static-assets/symbanta/symbanta-small.png"
            alt="Symbanta logo"
            className="h-8 w-8 shrink-0 object-contain sm:h-9 sm:w-9"
          />
          <span className="truncate text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl lg:text-4xl dark:text-stone-100">
            symbanta
          </span>
          <span className="hidden shrink-0 text-lg font-semibold text-stone-400 sm:inline lg:text-xl dark:text-stone-500">
            Συμβάντα
          </span>
        </a>
        <p className="mt-1.5 text-xs text-stone-500 sm:text-sm dark:text-stone-400">
          Your privacy-friendly cozy analytics dashboard.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <UserDetails />
        {onSelectDomain && (
          <DomainSwitcher onSelectDomain={onSelectDomain} selectedDomain={selectedDomain} />
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}

export default Header;
