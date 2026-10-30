// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { V1Property } from "./api/model";
import { useGetProperties } from "./api/symbanta";
import { DomainSwitcher } from "./DomainSwitcher.tsx";

vi.mock("./api/symbanta", () => ({
  useGetProperties: vi.fn(),
}));

const propertiesMock = vi.mocked(useGetProperties);

type PropertiesQuery = ReturnType<typeof useGetProperties>;

const properties: V1Property[] = [
  { id: "1", domain: "example.com", createdAt: "2026-01-01T00:00:00Z" },
  { id: "2", domain: "docs.example.com", createdAt: "2026-01-02T00:00:00Z" },
];

function mockQuery(overrides: Record<string, unknown>) {
  propertiesMock.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...overrides,
  } as unknown as PropertiesQuery);
}

beforeEach(() => {
  propertiesMock.mockReset();
});

describe("DomainSwitcher", () => {
  it("shows a placeholder while properties load", () => {
    mockQuery({ isLoading: true });

    render(<DomainSwitcher selectedDomain="" onSelectDomain={() => {}} />);

    expect(screen.getByText("Loading properties…")).toBeInTheDocument();
  });

  it("renders a select with every property once loaded", () => {
    mockQuery({ data: { data: { properties }, status: 200 } });

    render(<DomainSwitcher selectedDomain="example.com" onSelectDomain={() => {}} />);

    const select = screen.getByRole("combobox", { name: "Property" });
    expect(select).toHaveValue("example.com");
    expect(screen.getByRole("option", { name: "docs.example.com" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(2);
  });

  it("reports the selected property", async () => {
    const user = userEvent.setup();
    const onSelectDomain = vi.fn();
    mockQuery({ data: { data: { properties }, status: 200 } });

    render(<DomainSwitcher selectedDomain="example.com" onSelectDomain={onSelectDomain} />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Property" }),
      "docs.example.com",
    );

    expect(onSelectDomain).toHaveBeenCalledWith("docs.example.com");
  });

  it("auto-selects the first property when none is selected", async () => {
    const onSelectDomain = vi.fn();
    mockQuery({ data: { data: { properties }, status: 200 } });

    render(<DomainSwitcher selectedDomain="" onSelectDomain={onSelectDomain} />);

    await waitFor(() => expect(onSelectDomain).toHaveBeenCalledWith("example.com"));
    expect(onSelectDomain).toHaveBeenCalledTimes(1);
  });

  it("does not override an already selected property", () => {
    const onSelectDomain = vi.fn();
    mockQuery({ data: { data: { properties }, status: 200 } });

    render(<DomainSwitcher selectedDomain="docs.example.com" onSelectDomain={onSelectDomain} />);

    expect(onSelectDomain).not.toHaveBeenCalled();
  });

  it("falls back to a free-text domain input when loading properties fails", () => {
    const onSelectDomain = vi.fn();
    mockQuery({ isError: true });

    render(<DomainSwitcher selectedDomain="" onSelectDomain={onSelectDomain} />);

    const input = screen.getByRole("textbox", { name: "Domain" });
    expect(input).toHaveAttribute("placeholder", "Enter domain…");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: "typed.example.com" } });
    expect(onSelectDomain).toHaveBeenCalledWith("typed.example.com");
  });

  it("falls back to the input when the account has no properties", () => {
    mockQuery({ data: { data: { properties: [] }, status: 200 } });

    render(<DomainSwitcher selectedDomain="" onSelectDomain={() => {}} />);

    expect(screen.getByRole("textbox", { name: "Domain" })).toBeInTheDocument();
  });
});
