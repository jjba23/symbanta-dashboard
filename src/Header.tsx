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

function Header() {
  return (
    <header className="mb-10">
      <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 flex items-center gap-3">
        symbanta
        <img
          src="https://jointhefreeworld.org/static-assets/symbanta/symbanta-small.png"
          alt="Symbanta logo"
          className="h-8 w-auto inline-block align-middle object-contain"
        />
        Συμβάντα
      </h1>
      <p className="mt-2 text-base text-stone-500">
        Your privacy-friendly cozy analytics dashboard.
      </p>
    </header>
  );
}

export default Header;
