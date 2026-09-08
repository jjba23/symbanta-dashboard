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

import {useGetStatsSummary} from "./api/symbanta.ts";
import type {V1StatsSummaryResponse} from "./api/model";
import {formattedDate} from "./Prelude.ts";

interface StatsDashboardProps {
    domain?: string;
}

export function StatsDashboard({domain = "localhost"}: StatsDashboardProps) {
    const {data, isLoading, isError, error} = useGetStatsSummary({
        domain,
        period: "LAST_30_DAYS",
    });


    if (isLoading) {
        return <div>Loading analytics...</div>;
    }

    if (isError) {
        const errObj = error as { detail?: string; title?: string; message?: string };
        const errorMessage =
            errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";
        return <div>Error loading stats: {errorMessage}</div>;
    }


    const stats = data?.data as V1StatsSummaryResponse;

    const pageViews = stats.pageViews ?? 0;
    const visitors = stats.visitors ?? 0;
    const bounceRate = stats.bounceRate ?? 0;

    const roundDuration = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

    const averageDurationSeconds = stats.averageDurationMillis
        ? stats.averageDurationMillis / 1000
        : 0;

    // @ts-ignore
    const from = new Date(stats.from);
    // @ts-ignore
    const to = new Date(stats.to);


    return (
        <div className="w-full h-120 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-2xl text-pink-700">Analytics for: {domain}</h2>
            <p>Page Views: {pageViews.toLocaleString()}</p>
            <p>Visitors: {visitors.toLocaleString()}</p>
            <p>Average session duration =~ {roundDuration(averageDurationSeconds)} seconds</p>
            <p>Bounce Rate: {bounceRate}%</p>
            <p>From: {formattedDate(from)}</p>
            <p>To: {formattedDate(to)}</p>
        </div>
    );
}
