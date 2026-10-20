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
      <div className="inline-flex h-9 animate-pulse items-center gap-2 rounded-xl border border-stone-200/60 bg-stone-100/80 px-2.5 text-xs text-stone-400 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-500">
        <div className="h-1.5 w-1.5 rounded-full bg-stone-300 dark:bg-stone-700" />
        <span className="hidden sm:inline">Loading…</span>
        <span className="sr-only sm:hidden">Loading user</span>
      </div>
    );
  }

  if (isError || !userResponse) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-200/60 bg-red-50 px-2.5 text-xs font-medium text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
        <span className="hidden sm:inline">Failed to load user</span>
        <span className="sr-only sm:hidden">Failed to load user</span>
      </div>
    );
  }

  return (
    <div className="inline-flex h-9 min-w-0 items-center gap-2 rounded-xl border border-stone-200/80 bg-stone-50/80 px-2.5 text-xs transition-colors hover:bg-stone-100/80 dark:border-stone-800 dark:bg-stone-900/60 dark:hover:bg-stone-800/60">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="max-w-[7rem] truncate font-semibold text-stone-700 sm:max-w-[10rem] dark:text-stone-200">
          {userResponse.username}
        </span>
      </span>

      <span className="font-normal text-stone-300 select-none dark:text-stone-700">•</span>

      <span className="hidden rounded bg-stone-200/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-stone-600 uppercase sm:inline dark:bg-stone-800 dark:text-stone-400">
        {userResponse.role}
      </span>
    </div>
  );
}
