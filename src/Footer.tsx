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
    <footer className="mt-20 border-t border-stone-200/80 pt-8 pb-12 text-stone-500 text-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left Section: Logo, Copyright & Contact */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <img
              src="https://jointhefreeworld.org/static-assets/symbanta/symbanta-small.png"
              alt="Symbanta logo"
              className="h-5 w-auto object-contain align-middle"
            />
            <span className="font-bold text-stone-800 tracking-tight">symbanta</span>
            <span className="text-stone-300">•</span>
            <span className="text-stone-600">&copy; {currentYear} Josep Bigorra</span>
          </div>

          <p className="text-xs text-stone-400">
            Contact:{" "}
            <a
              href="mailto:jjbigorra@gmail.com"
              className="hover:text-stone-700 transition-colors underline decoration-stone-300 underline-offset-2"
            >
              jjbigorra@gmail.com
            </a>
          </p>
        </div>

        {/* Right Section: License & Code Repository */}
        <div className="flex flex-col md:items-end gap-1.5 text-xs text-stone-500">
          <p className="flex items-center gap-1.5">
            <span>Free Software under the</span>
            <a
              href="https://www.gnu.org/licenses/agpl-3.0.html"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-stone-700 hover:text-stone-900 transition-colors underline decoration-stone-300 underline-offset-2"
            >
              GNU AGPLv3+
            </a>
          </p>

          <p className="flex items-center gap-1.5">
            <span>Source code:</span>
            <a
              href="https://codeberg.org/jjba23/symbanta-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-stone-600 hover:text-stone-900 transition-colors bg-stone-100 px-2 py-0.5 rounded border border-stone-200/60"
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
