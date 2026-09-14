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
    <header className="mb-10">
      <a href="/">
        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100 flex flex-wrap items-center gap-3">
          <span>symbanta</span>
          <img
            src="https://jointhefreeworld.org/static-assets/symbanta/symbanta-small.png"
            alt="Symbanta logo"
            className="h-10 w-auto inline-block align-middle object-contain"
          />
          <span>Συμβάντα</span>
        </h1>
      </a>
      <p className="mt-2 text-base text-stone-500 dark:text-stone-400">
        Your privacy-friendly cozy analytics dashboard.
      </p>
      <div className="flex flex-wrap items-center gap-3 mt-4">
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
