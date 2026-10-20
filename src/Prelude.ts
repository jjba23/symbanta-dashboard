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

import { Period } from "./api/model";

export const formattedDate = (date: Date) =>
  date.toLocaleString(undefined, {
    dateStyle: "medium", // e.g., "Sep 7, 2026" or "7 sep. 2026"
    timeStyle: "short", // e.g., "8:52 AM" or "08:52"
  });

/** Short, mobile friendly date: "Sep 7" (adds the year when it is not the current one). */
export const formattedDateShort = (date: Date) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });

/** "Sep 7, 2026, 8:52 AM – Sep 14, 2026, 9:00 AM" */
export const formattedDateRange = (from: Date, to: Date) =>
  `${formattedDate(from)} – ${formattedDate(to)}`;

/** "Sep 7 – Sep 14", compact enough for narrow screens. */
export const formattedDateRangeShort = (from: Date, to: Date) =>
  `${formattedDateShort(from)} – ${formattedDateShort(to)}`;

export const roundToTwoPlaces = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds < 0) return "0s"; // Fallback for negative numbers

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);

  // Only show 2 decimal places for the seconds
  parts.push(`${seconds.toFixed(2)}s`);

  return parts.join(" ");
};

export type PeriodType = (typeof Period)[keyof typeof Period];

export const periodLabels: Record<PeriodType, string> = {
  [Period.TODAY]: "Today",
  [Period.YESTERDAY]: "Yesterday",
  [Period.LAST_24_HOURS]: "Last 24 Hours",
  [Period.LAST_3_DAYS]: "Last 3 Days",
  [Period.LAST_7_DAYS]: "Last 7 Days",
  [Period.LAST_30_DAYS]: "Last 30 Days",
  [Period.THIS_MONTH]: "This month",
  [Period.LAST_MONTH]: "Last month",
  [Period.LAST_6_MONTHS]: "Last 6 Months",
  [Period.LAST_12_MONTHS]: "Last 12 Months",
  [Period.THIS_YEAR]: "This year",
  [Period.LAST_YEAR]: "Last year",
  [Period.ALL_TIME]: "All time",
  [Period.CUSTOM]: "Custom",
};

export function getCookie(name: string): string {
  const match: RegExpMatchArray | null = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)"),
  );
  // @ts-ignore
  return match ? decodeURIComponent(match[2]) : "";
}

export function setCookie(name: string, value: string, days = 365): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
