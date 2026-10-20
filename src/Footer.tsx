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

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-4 border-t border-stone-200/80 pt-6 pb-8 text-sm text-stone-500 sm:pt-8 sm:pb-12 dark:border-stone-800 dark:text-stone-400">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
        {/* Left Section: Logo, Copyright & Contact */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <img
              src="https://jointhefreeworld.org/static-assets/symbanta/symbanta-small.png"
              alt="Symbanta logo"
              className="h-5 w-5 shrink-0 object-contain"
            />
            <span className="font-bold tracking-tight text-stone-800 dark:text-stone-100">
              symbanta
            </span>
            <span className="text-stone-300 dark:text-stone-700">•</span>
            <span className="text-stone-600 dark:text-stone-400">
              &copy; {currentYear} Josep Bigorra
            </span>
          </div>

          <p className="text-xs text-stone-400 dark:text-stone-500">
            Contact:{" "}
            <a
              href="mailto:jjbigorra@gmail.com"
              className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700 dark:decoration-stone-700 dark:hover:text-stone-300"
            >
              jjbigorra@gmail.com
            </a>
          </p>
        </div>

        {/* Right Section: License & Code Repository */}
        <div className="flex flex-col gap-1.5 text-xs text-stone-500 md:items-end dark:text-stone-400">
          <p className="flex flex-wrap items-center gap-1.5">
            <span>Free Software under the</span>
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:decoration-stone-700 dark:hover:text-stone-100"
            >
              GNU AGPLv3+
            </a>
          </p>

          <p className="flex flex-wrap items-center gap-1.5">
            <span>Source code:</span>
            <a
              href="https://codeberg.org/jjba23/symbanta-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 break-all text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
            >
              codeberg.org/jjba23/symbanta-dashboard
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
