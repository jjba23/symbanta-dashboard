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

import {useState} from "react";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useGetStatsSummary} from "./api/symbanta.ts";
import {formatDuration, formattedDate, roundToTwoPlaces} from "./Prelude.ts";
import {GetStatsSummaryPeriod, type V1StatsSummaryResponse} from "./api/model";

type PeriodType = typeof GetStatsSummaryPeriod[keyof typeof GetStatsSummaryPeriod];

const PERIOD_LABELS: Record<PeriodType, string> = {
    [GetStatsSummaryPeriod.LAST_24_HOURS]: 'Last 24 Hours',
    [GetStatsSummaryPeriod.LAST_7_DAYS]: 'Last 7 Days',
    [GetStatsSummaryPeriod.LAST_30_DAYS]: 'Last 30 Days',
    [GetStatsSummaryPeriod.LAST_6_MONTHS]: 'Last 6 Months',
    [GetStatsSummaryPeriod.LAST_12_MONTHS]: 'Last 12 Months',
    [GetStatsSummaryPeriod.CUSTOM]: 'Custom',
};

interface StatsDashboardProps {
    domain?: string;
}

const loginUser = async (credentials: { username: string; password: string }) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        throw new Error('Invalid username or password');
    }
    return response.json();
};

function StatCard({title, value}: { title: string; value: string | number }) {
    return (
        <div className="flex flex-col p-5 bg-stone-50/80 rounded-2xl border border-stone-100">
            <span className="text-sm font-medium text-stone-500 mb-1">{title}</span>
            <span className="text-3xl font-bold text-stone-800">{value}</span>
        </div>
    );
}

export function StatsDashboard({domain = "localhost"}: StatsDashboardProps) {
    const [period, setPeriod] = useState<PeriodType>(GetStatsSummaryPeriod.LAST_30_DAYS);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const queryClient = useQueryClient();

    const {data, isLoading, isError, error} = useGetStatsSummary({
        domain,
        period,
    });

    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: () => {
            queryClient.invalidateQueries();
        },
    });

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({username, password});
    };

    if (isLoading) {
        return (
            <div className="p-8 text-stone-500 text-center animate-pulse">
                Gathering leaves... (Loading analytics)
            </div>
        );
    }

    if (isError) {
        const errObj = error as {
            status?: number;
            response?: { status?: number };
            detail?: string;
            title?: string;
            message?: string
        };
        const status = errObj?.status || errObj?.response?.status;
        const isAuthError = status === 401 || status === 403;

        if (isAuthError) {
            return (
                <div
                    className="w-full max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-stone-200/60 my-10">
                    <h2 className="text-xl font-bold text-stone-800 mb-2">Authentication Required</h2>
                    <p className="text-sm text-stone-500 mb-6">Please log in to view overview statistics.</p>

                    <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="w-full text-sm text-stone-800 bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                placeholder="Enter username"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-stone-600 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full text-sm text-stone-800 bg-stone-50 px-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                placeholder="••••••••"
                            />
                        </div>

                        {loginMutation.isError && (
                            <p className="text-xs text-rose-500 font-medium">
                                {(loginMutation.error as Error).message}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loginMutation.isPending}
                            className="w-full mt-2 bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {loginMutation.isPending ? 'Logging in...' : 'Sign In'}
                        </button>
                    </form>
                </div>
            );
        }

        const errorMessage = errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";
        return (
            <div className="p-8 text-rose-500 bg-rose-50 rounded-3xl">
                Error loading stats: {errorMessage}
            </div>
        );
    }

    const stats = data?.data as V1StatsSummaryResponse;

    const pageViews = stats.pageViews ?? 0;
    const visitors = stats.visitors ?? 0;
    const bounceRate = stats.bounceRate ?? 0;

    const averageDurationSeconds = stats.averageDurationMillis
        ? stats.averageDurationMillis / 1000
        : 0;

    // @ts-ignore
    const from = new Date(stats.from);
    // @ts-ignore
    const to = new Date(stats.to);

    return (
        <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/60">

            {/* Header section with responsive pickers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-bold text-stone-800 flex items-center gap-2">
                    Overview for
                    <span className="text-rose-600 bg-rose-50 px-3 py-1 rounded-xl text-sm border border-rose-100">
                        {domain}
                    </span>
                </h2>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Dynamic Period Select Dropdown */}
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as PeriodType)}
                        className="text-sm font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                        {Object.values(GetStatsSummaryPeriod)
                            .filter((p) => p !== GetStatsSummaryPeriod.CUSTOM)
                            .map((p) => (
                                <option key={p} value={p}>
                                    {PERIOD_LABELS[p]}
                                </option>
                            ))}
                    </select>

                    {/* Date range display */}
                    <div
                        className="text-sm font-medium text-stone-500 bg-stone-100 px-4 py-1.5 rounded-full flex items-center gap-2">
                        <span>🗓</span> {formattedDate(from)} <span
                        className="text-stone-300">—</span> {formattedDate(to)}
                    </div>
                </div>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard title="Page Views" value={pageViews.toLocaleString()}/>
                <StatCard title="Unique Visitors" value={visitors.toLocaleString()}/>
                <StatCard title="Avg. Visit" value={`${formatDuration(averageDurationSeconds)}`}/>
                <StatCard title="Bounce Rate" value={`${roundToTwoPlaces(bounceRate)}%`}/>
            </div>

        </div>
    );
}