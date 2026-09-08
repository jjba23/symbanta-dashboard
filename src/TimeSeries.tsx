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
import {useGetTimeSeriesStats} from "./api/symbanta.ts";
import {GetTimeSeriesStatsPeriod, type V1TimeSeriesStatsResponse} from "./api/model";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    type TooltipProps,
    XAxis,
    YAxis
} from 'recharts';

type PeriodType = typeof GetTimeSeriesStatsPeriod[keyof typeof GetTimeSeriesStatsPeriod];

const PERIOD_LABELS: Record<PeriodType, string> = {
    [GetTimeSeriesStatsPeriod.LAST_24_HOURS]: 'Last 24 Hours',
    [GetTimeSeriesStatsPeriod.LAST_7_DAYS]: 'Last 7 Days',
    [GetTimeSeriesStatsPeriod.LAST_30_DAYS]: 'Last 30 Days',
    [GetTimeSeriesStatsPeriod.LAST_6_MONTHS]: 'Last 6 Months',
    [GetTimeSeriesStatsPeriod.LAST_12_MONTHS]: 'Last 12 Months',
    [GetTimeSeriesStatsPeriod.CUSTOM]: 'Custom',
};

interface StatsDashboardProps {
    domain?: string;
}

// Helper login fetcher matching Spring Boot /api/auth/login endpoint
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

// --- Custom Tooltip ---
// @ts-ignore
const CustomTooltip = ({active, payload, label}: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-4 border border-stone-100 shadow-xl rounded-2xl">
                <p className="text-stone-500 mb-3 font-medium text-sm">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
                        <div
                            className="w-3 h-3 rounded-full shadow-sm"
                            style={{backgroundColor: entry.color}}
                        />
                        <span className="font-semibold text-stone-700">{entry.name}:</span>
                        <span className="text-stone-900">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function TimeSeries({domain = "localhost"}: StatsDashboardProps) {
    const [period, setPeriod] = useState<PeriodType>(GetTimeSeriesStatsPeriod.LAST_30_DAYS);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const queryClient = useQueryClient();

    const {data, isLoading, isError, error} = useGetTimeSeriesStats({
        domain,
        period,
    });

    // Login Mutation
    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: () => {
            // Refetch queries after authenticating
            queryClient.invalidateQueries();
        },
    });

    const handleLoginSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        loginMutation.mutate({username, password});
    };

    if (isLoading) {
        return <div className="p-8 text-stone-500 text-center animate-pulse">Loading time series...</div>;
    }

    // Handle Authorization / Error State
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

        // Render Login Form if unauthorized or unauthenticated
        if (isAuthError) {
            return (
                <div
                    className="w-full max-w-md mx-auto bg-white p-8 rounded-3xl shadow-sm border border-stone-200/60 my-10">
                    <h2 className="text-xl font-bold text-stone-800 mb-2">Authentication Required</h2>
                    <p className="text-sm text-stone-500 mb-6">Please log in to view traffic analytics.</p>

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
        return <div className="p-8 text-rose-500 bg-rose-50 rounded-3xl">Error loading time
            series: {errorMessage}</div>;
    }

    const stats = data?.data as V1TimeSeriesStatsResponse | undefined;

    if (!stats || !stats.points || stats.points.length === 0) {
        return (
            <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/60">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <h2 className="text-xl font-bold text-stone-800">Traffic Trends</h2>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value as PeriodType)}
                        className="text-sm font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                    >
                        {Object.values(GetTimeSeriesStatsPeriod)
                            .filter((p) => p !== GetTimeSeriesStatsPeriod.CUSTOM)
                            .map((p) => (
                                <option key={p} value={p}>
                                    {PERIOD_LABELS[p]}
                                </option>
                            ))}
                    </select>
                </div>
                <div className="p-8 text-center text-stone-500">
                    No traffic data available for this period yet. 🍂
                </div>
            </div>
        );
    }

    const chartData = stats.points.map((point) => {
        const date = new Date(point.timestamp);
        let formattedLabel = '';
        if (stats.granularity === 'DAY') {
            formattedLabel = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });
        } else {
            formattedLabel = date.toLocaleTimeString(undefined, {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return {
            ...point,
            label: formattedLabel,
        };
    });

    return (
        <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-stone-200/60">
            {/* Header with Title and Period Picker */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <h2 className="text-xl font-bold text-stone-800">Traffic Trends</h2>

                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as PeriodType)}
                    className="text-sm font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                    {Object.values(GetTimeSeriesStatsPeriod)
                        .filter((p) => p !== GetTimeSeriesStatsPeriod.CUSTOM)
                        .map((p) => (
                            <option key={p} value={p}>
                                {PERIOD_LABELS[p]}
                            </option>
                        ))}
                </select>
            </div>

            {/* Chart Area */}
            <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{top: 10, right: 10, left: -20, bottom: 0}}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f4"/>

                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#a8a29e', fontSize: 12}}
                            dy={10}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#a8a29e', fontSize: 12}}
                            allowDecimals={false}
                        />

                        <Tooltip content={<CustomTooltip/>} cursor={{fill: '#fafaf9'}}/>

                        <Legend
                            verticalAlign="top"
                            height={40}
                            iconType="circle"
                            wrapperStyle={{fontSize: '14px', color: '#57534e', paddingBottom: '10px'}}
                        />

                        <Bar
                            dataKey="pageViews"
                            name="Page Views"
                            fill="#8b5cf6"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                        />

                        <Bar
                            dataKey="visitors"
                            name="Unique Visitors"
                            fill="#f472b6"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={45}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}