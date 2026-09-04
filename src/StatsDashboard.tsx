import { useGetStatsSummary } from "./api/symbanta.ts";

interface StatsDashboardProps {
  domain?: string;
}

export function StatsDashboard({ domain = "localhost" }: StatsDashboardProps) {
  const { data, isLoading, isError, error } = useGetStatsSummary({
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

  const stats = data?.data;

  const pageViews = stats?.pageViews ?? 0;
  const visitors = stats?.visitors ?? 0;
  const bounceRate = stats?.bounceRate ?? 0;

  const roundDuration = num => Math.round((num + Number.EPSILON) * 100) / 100

  const averageDurationSeconds = stats?.averageDurationMillis
    ? stats.averageDurationMillis / 1000
    : 0;

  return (
    <div>
      <h2>Analytics for {domain}</h2>
      <p>Page Views: {pageViews.toLocaleString()}</p>
      <p>Visitors: {visitors.toLocaleString()}</p>
      <p>Average session duration =~ {roundDuration(averageDurationSeconds)} seconds</p>
      <p>Bounce Rate: {bounceRate}%</p>
    </div>
  );
}
