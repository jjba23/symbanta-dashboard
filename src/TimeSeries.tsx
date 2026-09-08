import {useGetTimeSeriesStats} from "./api/symbanta.ts";
import type {V1TimeSeriesStatsResponse} from "./api/model";
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
import {formattedDate} from "./Prelude.ts";

interface StatsDashboardProps {
    domain?: string;
}

// --- Custom Tooltip ---
// @ts-ignore
const CustomTooltip = ({active, payload, label}: TooltipProps<number, string>) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-md">
                <p className="text-gray-600 mb-2 font-medium">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{backgroundColor: entry.color}}
                        />
                        <span className="font-semibold text-gray-800">{entry.name}:</span>
                        <span className="text-gray-900">{entry.value}</span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function TimeSeries({domain = "localhost"}: StatsDashboardProps) {
    const {data, isLoading, isError, error} = useGetTimeSeriesStats({
        domain,
        period: "LAST_30_DAYS",
    });

    if (isLoading) {
        return <div className="p-4 text-gray-500">Loading analytics...</div>;
    }

    if (isError) {
        const errObj = error as { detail?: string; title?: string; message?: string };
        const errorMessage =
            errObj?.detail || errObj?.title || errObj?.message || "An unknown error occurred";
        return <div className="p-4 text-red-500">Error loading stats: {errorMessage}</div>;
    }

    const stats = data?.data as V1TimeSeriesStatsResponse | undefined;

    // Safety check: ensure stats and points exist before attempting to map
    if (!stats || !stats.points || stats.points.length === 0) {
        return <div className="p-4 text-gray-500">No data available for this period.</div>;
    }

    // @ts-ignore
    const from = new Date(stats.from);
    // @ts-ignore
    const to = new Date(stats.to);

    // Transform the payload to format dates nicely for the X-Axis
    const chartData = stats.points.map((point) => {
        // The browser natively converts the 'Z' (UTC) timestamp to local timezone
        const date = new Date(point.timestamp);

        let formattedLabel = '';
        if (stats.granularity === 'DAY') {
            // e.g., "Sep 07"
            formattedLabel = date.toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
            });
        } else {
            // e.g., "14:00"
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

        <div className="space-y-4">


            {/* Wrapper div provides constraints for ResponsiveContainer */}
            <div className="w-full h-120 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <section>
                    <h2 className="text-2xl text-pink-700">TimeSeries for: {domain}</h2>
                    <div className="flex flex-wrap flex-row gap-1 my-2 w-full">

                        <p className="min-w-lg">From: {formattedDate(from)}</p>
                        <p className="min-w-lg">To: {formattedDate(to)}</p>
                    </div>
                </section>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{top: 10, right: 10, left: -20, bottom: 0}}
                    >
                        {/* Subtle horizontal grid lines only */}
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>

                        <XAxis
                            dataKey="label"
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#6B7280', fontSize: 12}}
                            dy={10} // Padding top
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{fill: '#6B7280', fontSize: 12}}
                            allowDecimals={false} // Don't show 0.5 page views
                        />

                        <Tooltip content={<CustomTooltip/>} cursor={{fill: '#F3F4F6'}}/>

                        <Legend
                            position="top"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{fontSize: '14px', color: '#374151'}}
                        />

                        {/* Page Views Bar */}
                        <Bar
                            dataKey="pageViews"
                            name="Page Views"
                            fill="#3B82F6" // Tailwind Blue 500
                            radius={[4, 4, 0, 0]} // Rounded top corners
                            maxBarSize={50}
                        />

                        {/* Visitors Bar */}
                        <Bar
                            dataKey="visitors"
                            name="Unique Visitors"
                            fill="#10B981" // Tailwind Emerald 500
                            radius={[4, 4, 0, 0]}
                            maxBarSize={50}
                        />
                    </BarChart>


                </ResponsiveContainer>


            </div>
        </div>
    );
}