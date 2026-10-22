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

import { useGetCurrentUser } from "./api/symbanta";
import type { AuthResponse } from "./api/model";

export function UserDetails() {
  const { data, isLoading, isError } = useGetCurrentUser();

  const userResponse = data?.data as AuthResponse | undefined;

  if (isLoading) {
    return (
      <div className="glass-inset inline-flex h-9 animate-pulse items-center gap-2 rounded-xl px-2.5 text-xs text-stone-400 dark:text-stone-500">
        <div className="h-1.5 w-1.5 rounded-full bg-stone-400/60 dark:bg-stone-600" />
        <span className="hidden sm:inline">Loading…</span>
        <span className="sr-only sm:hidden">Loading user</span>
      </div>
    );
  }

  if (isError || !userResponse) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-300/50 bg-red-50/80 px-2.5 text-xs font-medium text-red-600 backdrop-blur-sm dark:border-red-500/25 dark:bg-red-950/40 dark:text-red-300">
        <span className="hidden sm:inline">Failed to load user</span>
        <span className="sr-only sm:hidden">Failed to load user</span>
      </div>
    );
  }

  return (
    <div className="glass-inset inline-flex h-9 min-w-0 items-center gap-2 rounded-xl px-2.5 text-xs">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="max-w-[7rem] truncate font-semibold text-stone-700 sm:max-w-[10rem] dark:text-stone-200">
          {userResponse.username}
        </span>
      </span>

      <span className="font-normal text-stone-300 select-none dark:text-stone-600">•</span>

      <span className="hidden rounded-md bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-stone-600 uppercase ring-1 ring-white/70 ring-inset sm:inline dark:bg-white/10 dark:text-stone-300 dark:ring-white/10">
        {userResponse.role}
      </span>
    </div>
  );
}
