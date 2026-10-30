// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

/** Origin baked into the Orval-generated client (`src/api/symbanta.ts`). */
export const API_ORIGIN = "https://api.symbanta.jointhefreeworld.org";

/**
 * Point the generated absolute URLs at another API.
 *
 * The client is generated from the public OpenAPI document, so every URL is
 * absolute. Setting `VITE_API_BASE_URL` re-roots them without touching the
 * generated code:
 *
 *   VITE_API_BASE_URL=/mock-api               → same-origin mock (dev default)
 *   VITE_API_BASE_URL=http://127.0.0.1:8787   → standalone mock (`npm run mock:api`)
 *   VITE_API_BASE_URL=https://staging.example → any other deployment
 *
 * Empty/unset keeps the production API.
 */
export function resolveApiUrl(url: string): string {
  const configured = String(import.meta.env["VITE_API_BASE_URL"] ?? "").trim();
  const base = configured.replace(/\/+$/, "");

  if (base.length === 0 || !url.startsWith(API_ORIGIN)) {
    return url;
  }

  return `${base}${url.slice(API_ORIGIN.length)}`;
}

export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(resolveApiUrl(url), {
    ...options,
    credentials: "include",
  });

  const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
  const body = [204, 205, 304].includes(response.status) ? null : await response.text();
  const data = body ? (contentType.includes("json") ? JSON.parse(body) : body) : {};

  if (!response.ok) {
    throw { status: response.status, data };
  }

  return { data, status: response.status, headers: response.headers } as T;
};

export default customFetch;
