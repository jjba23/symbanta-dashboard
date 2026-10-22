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

import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach } from "vitest";
import { installMatchMedia, resetMatchMedia } from "./matchMedia.ts";

/*
 * jsdom has no layout engine and no ResizeObserver. Recharts' responsive
 * container needs one, so provide a no-op implementation for the tests that
 * render the whole dashboard.
 */
if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

/*
 * jsdom throws "not implemented" whenever a canvas context is requested.
 * Recharts probes one for text measurement; returning null keeps the test
 * output clean without hiding anything the suite cares about.
 */
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = (() =>
    null) as typeof HTMLCanvasElement.prototype.getContext;
}

/* Mirror the static shell from index.html so document-level a11y checks pass. */
document.documentElement.lang = "en";
document.title = "symbanta · analytics";

function clearCookies(): void {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}

function resetDocumentTheme(): void {
  document.documentElement.classList.remove("dark");
  document.documentElement.style.colorScheme = "";
  document.documentElement.lang = "en";
}

beforeEach(() => {
  clearCookies();
  localStorage.clear();
  resetMatchMedia();
  resetDocumentTheme();
});

afterEach(() => {
  cleanup();
});

installMatchMedia();
