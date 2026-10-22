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

type MediaQueryListener = (event: MediaQueryListEvent) => void;

let prefersDark = false;
const listeners = new Set<MediaQueryListener>();

/** jsdom does not implement `matchMedia`, so tests get a controllable stub. */
export function installMatchMedia(): void {
  window.matchMedia = ((query: string) => {
    const isDarkQuery = query.includes("prefers-color-scheme: dark");

    return {
      get matches() {
        return isDarkQuery ? prefersDark : false;
      },
      media: query,
      onchange: null,
      addEventListener: (type: string, listener: MediaQueryListener) => {
        if (type === "change") listeners.add(listener);
      },
      removeEventListener: (type: string, listener: MediaQueryListener) => {
        if (type === "change") listeners.delete(listener);
      },
      addListener: (listener: MediaQueryListener) => listeners.add(listener),
      removeListener: (listener: MediaQueryListener) => listeners.delete(listener),
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  }) as typeof window.matchMedia;
}

/** Flip the emulated OS colour scheme and notify the active media queries. */
export function setPrefersDark(matches: boolean): void {
  prefersDark = matches;
  const event = { matches, media: "(prefers-color-scheme: dark)" } as MediaQueryListEvent;
  for (const listener of listeners) {
    listener(event);
  }
}

/** Restore the initial "light OS" state between tests. */
export function resetMatchMedia(): void {
  prefersDark = false;
  listeners.clear();
  installMatchMedia();
}
