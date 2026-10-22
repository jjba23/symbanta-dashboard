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

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { getCookie, setCookie } from "../Prelude.ts";
import { ContrastProvider, useContrast } from "./ContrastContext.tsx";
import { ContrastToggle } from "./ContrastToggle.tsx";

const CONTRAST_COOKIE = "symbanta_contrast";

function ContrastProbe() {
  const { preference, resolvedContrast } = useContrast();

  return (
    <div>
      <span data-testid="preference">{preference}</span>
      <span data-testid="resolved">{resolvedContrast}</span>
      <ContrastToggle />
    </div>
  );
}

function renderContrast() {
  return render(
    <ContrastProvider>
      <ContrastProbe />
    </ContrastProvider>,
  );
}

describe("ContrastProvider", () => {
  it("defaults to the system preference and leaves the document untouched", () => {
    renderContrast();

    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("normal");
    expect(document.documentElement).toHaveAttribute("data-contrast", "normal");
    expect(document.documentElement).not.toHaveClass("contrast-more");
  });

  it("restores an explicit preference from the cookie", () => {
    setCookie(CONTRAST_COOKIE, "more");

    renderContrast();

    expect(screen.getByTestId("preference")).toHaveTextContent("more");
    expect(document.documentElement).toHaveAttribute("data-contrast", "more");
    expect(document.documentElement).toHaveClass("contrast-more");
  });

  it("ignores stored values it does not understand", () => {
    setCookie(CONTRAST_COOKIE, "maximum");

    renderContrast();

    expect(screen.getByTestId("preference")).toHaveTextContent("system");
  });
});

describe("ContrastToggle", () => {
  it("is a labelled toggle button with a stable accessible name", () => {
    renderContrast();

    const toggle = screen.getByRole("button", { name: "Increase contrast" });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles the high-contrast material and persists the choice", async () => {
    const user = userEvent.setup();
    renderContrast();

    const toggle = screen.getByRole("button", { name: "Increase contrast" });
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("resolved")).toHaveTextContent("more");
    expect(document.documentElement).toHaveAttribute("data-contrast", "more");
    expect(getCookie(CONTRAST_COOKIE)).toBe("more");
  });

  it("switches back to the system preference", async () => {
    const user = userEvent.setup();
    renderContrast();

    const toggle = screen.getByRole("button", { name: "Increase contrast" });
    await user.click(toggle);
    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("preference")).toHaveTextContent("system");
    expect(document.documentElement).toHaveAttribute("data-contrast", "normal");
    expect(getCookie(CONTRAST_COOKIE)).toBe("system");
  });

  it("is reachable and operable with the keyboard", async () => {
    const user = userEvent.setup();
    renderContrast();

    await user.tab();
    expect(screen.getByRole("button", { name: "Increase contrast" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Increase contrast" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
