// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

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
