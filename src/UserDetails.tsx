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

import {useGetCurrentUser} from "./api/symbanta";
import type {AuthResponse} from "./api/model";

export function UserDetails() {
    const {data, isLoading, isError} = useGetCurrentUser();

    const userResponse = data?.data as AuthResponse | undefined;

    if (isLoading) {
        return (
            <div
                className="inline-flex items-center gap-2 px-2.5 py-1 bg-stone-100/80 border border-stone-200/60 rounded-md animate-pulse text-xs text-stone-400">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-300"/>
                <span>Loading...</span>
            </div>
        );
    }

    if (isError || !userResponse) {
        return (
            <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 border border-red-200/60 rounded-md text-xs text-red-600 font-medium">
                <span>Failed to load user</span>
            </div>
        );
    }

    return (
        <div
            className="inline-flex items-center gap-2 px-2.5 py-1 bg-stone-50/80 hover:bg-stone-100/80 border border-stone-200/80 rounded-md text-xs transition-colors">
            <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"/>
                <span className="font-semibold text-stone-700">{userResponse.username}</span>
            </div>

            <span className="text-stone-300 select-none font-normal">•</span>

            <span
                className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-stone-200/60 text-stone-600 rounded">
                {userResponse.role}
            </span>
        </div>
    );
}
