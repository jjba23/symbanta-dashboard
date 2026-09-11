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

export const formattedDate = (date: Date) =>
  date.toLocaleString(undefined, {
    dateStyle: "medium", // e.g., "Sep 7, 2026" or "7 sep. 2026"
    timeStyle: "short", // e.g., "8:52 AM" or "08:52"
  });

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
