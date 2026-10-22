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
