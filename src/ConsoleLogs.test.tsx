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
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { V1ConsoleLogEntry } from "./api/model";
import { useGetConsoleLogs } from "./api/symbanta.ts";
import { ConsoleLogs } from "./ConsoleLogs.tsx";
import { formattedDate, setCookie } from "./Prelude.ts";
import { I18nProvider, LOCALE_COOKIE_KEY } from "./i18n/I18nContext.tsx";

vi.mock("./api/symbanta.ts", () => ({
  useGetConsoleLogs: vi.fn(),
}));

const logsMock = vi.mocked(useGetConsoleLogs);

type LogsQuery = ReturnType<typeof useGetConsoleLogs>;

const entries: V1ConsoleLogEntry[] = [
  {
    timestamp: "2026-09-07T08:52:00Z",
    level: "error",
    message: "Checkout failed",
    url: "/checkout",
    country: "ES",
  },
  {
    timestamp: "2026-09-07T08:51:00Z",
    level: "log",
    message: "App started",
    country: "ZZ",
  },
];

function mockQuery(overrides: Record<string, unknown>) {
  logsMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    error: null,
    ...overrides,
  } as unknown as LogsQuery);
}

beforeEach(() => {
  logsMock.mockReset();
});

describe("ConsoleLogs", () => {
  it("shows a skeleton while loading", () => {
    mockQuery({ isLoading: true });

    render(<ConsoleLogs domain="example.com" />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading analytics…");
  });

  it("renders forwarded log entries newest first", () => {
    mockQuery({ data: { data: { items: entries }, status: 200 } });

    render(<ConsoleLogs domain="example.com" />);

    const messages = screen.getAllByRole("listitem");
    expect(messages).toHaveLength(2);
    expect(messages[0]).toHaveTextContent("Checkout failed");
    expect(messages[1]).toHaveTextContent("App started");
  });

  it("shows severity, timestamp and source of each entry", () => {
    mockQuery({ data: { data: { items: entries }, status: 200 } });

    render(<ConsoleLogs domain="example.com" />);

    expect(screen.getByText("error")).toBeInTheDocument();
    expect(screen.getByText("log")).toBeInTheDocument();
    expect(
      screen.getByText(formattedDate(new Date("2026-09-07T08:52:00Z"), "en")),
    ).toBeInTheDocument();
    expect(screen.getByText("/checkout")).toBeInTheDocument();
    expect(screen.getByText("ES")).toBeInTheDocument();
  });

  it("hides the unknown-country placeholder", () => {
    mockQuery({ data: { data: { items: entries }, status: 200 } });

    render(<ConsoleLogs domain="example.com" />);

    expect(screen.queryByText("ZZ")).not.toBeInTheDocument();
  });

  it("requests every level by default", () => {
    mockQuery({ isLoading: true });

    render(<ConsoleLogs domain="example.com" />);

    expect(logsMock).toHaveBeenCalledWith({ domain: "example.com", limit: 100 });
  });

  it("requests only the selected level", async () => {
    const user = userEvent.setup();
    mockQuery({ isLoading: true });

    render(<ConsoleLogs domain="example.com" />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Log level" }), "error");

    expect(logsMock).toHaveBeenLastCalledWith({
      domain: "example.com",
      limit: 100,
      level: "error",
    });
  });

  it("renders in Spanish, including pluralised option labels", () => {
    setCookie(LOCALE_COOKIE_KEY, "es");
    mockQuery({ isLoading: true });

    render(
      <I18nProvider>
        <ConsoleLogs domain="example.com" />
      </I18nProvider>,
    );

    expect(screen.getByRole("heading", { name: "Registros de consola" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Nivel del registro" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "50 entradas" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "1 entrada" })).not.toBeInTheDocument();
  });

  it("requests the selected number of entries", async () => {
    const user = userEvent.setup();
    mockQuery({ isLoading: true });

    render(<ConsoleLogs domain="example.com" />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Number of log entries" }),
      "250",
    );

    expect(logsMock).toHaveBeenLastCalledWith({ domain: "example.com", limit: 250 });
  });

  it("mentions the active level in the empty state", async () => {
    const user = userEvent.setup();
    mockQuery({ data: { data: { items: [] }, status: 200 } });

    render(<ConsoleLogs domain="example.com" />);

    expect(screen.getByRole("heading", { name: "No console logs" })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Log level" }), "warn");

    expect(screen.getByText(/at level warn/)).toBeInTheDocument();
  });

  it("renders an error state with the API message", () => {
    mockQuery({ isError: true, error: { data: { title: "Forbidden" } } });

    render(<ConsoleLogs domain="example.com" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Could not load console logs");
    expect(alert).toHaveTextContent("Forbidden");
  });
});
