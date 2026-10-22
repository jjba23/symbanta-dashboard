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

import { useState } from "react";
import { useGetConsoleLogs } from "./api/symbanta.ts";
import { ConsoleLogLevel, type V1ConsoleLogEntry, type V1ConsoleLogsResponse } from "./api/model";
import { errorMessage, formattedDate } from "./Prelude.ts";
import {
  Card,
  CardHeader,
  cardPaddingClass,
  controlClass,
  EmptyState,
  ErrorState,
  TableSkeleton,
  TerminalIcon,
} from "./ui.tsx";

interface ConsoleLogsProps {
  domain?: string;
  className?: string;
}

type LevelFilter = ConsoleLogLevel | "all";

const levelFilters: Array<{ value: LevelFilter; label: string }> = [
  { value: "all", label: "All levels" },
  { value: ConsoleLogLevel.log, label: "Log" },
  { value: ConsoleLogLevel.info, label: "Info" },
  { value: ConsoleLogLevel.warn, label: "Warn" },
  { value: ConsoleLogLevel.error, label: "Error" },
  { value: ConsoleLogLevel.debug, label: "Debug" },
];

const levelBadgeClass: Record<ConsoleLogLevel, string> = {
  log: "bg-stone-500/10 text-stone-600 ring-stone-500/20 dark:bg-white/10 dark:text-stone-200 dark:ring-white/15",
  info: "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/25",
  warn: "bg-amber-500/15 text-amber-800 ring-amber-500/30 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
  error:
    "bg-rose-500/10 text-rose-700 ring-rose-500/25 dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/25",
  debug:
    "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/25",
};

const limitOptions = [50, 100, 250, 500];

function LogEntry({ entry }: { entry: V1ConsoleLogEntry }) {
  return (
    <li className="flex flex-col gap-1.5 px-4 py-3 sm:px-6 lg:px-7">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-stone-500 dark:text-stone-400">
        <span
          className={`rounded-md px-1.5 py-0.5 font-mono font-semibold tracking-wide uppercase ring-1 ring-inset ${
            levelBadgeClass[entry.level] ?? levelBadgeClass.log
          }`}
        >
          {entry.level}
        </span>
        <time dateTime={entry.timestamp}>{formattedDate(new Date(entry.timestamp))}</time>
        {entry.country && entry.country !== "ZZ" && (
          <span className="rounded-md bg-white/60 px-1.5 py-0.5 font-medium ring-1 ring-white/70 ring-inset dark:bg-white/10 dark:ring-white/10">
            {entry.country}
          </span>
        )}
        {entry.url && (
          <span className="min-w-0 max-w-full truncate font-mono text-stone-500 dark:text-stone-400">
            {entry.url}
          </span>
        )}
      </div>
      <p className="font-mono text-xs leading-relaxed break-words whitespace-pre-wrap text-stone-800 sm:text-[13px] dark:text-stone-200">
        {entry.message}
      </p>
    </li>
  );
}

/**
 * Console output forwarded by the instrumented applications (`console.log` /
 * `console.error` capture). Newest first, filterable by severity. Not bound to
 * the reporting period: logs are diagnostics rather than analytics.
 */
export function ConsoleLogs({ domain = "localhost", className }: ConsoleLogsProps) {
  const [level, setLevel] = useState<LevelFilter>("all");
  const [limit, setLimit] = useState(100);

  const { data, isLoading, isError, error } = useGetConsoleLogs({
    domain,
    limit,
    ...(level === "all" ? {} : { level }),
  });

  const response = data?.data as V1ConsoleLogsResponse | undefined;
  const entries = response?.items ?? [];

  return (
    <Card className={className}>
      <div className={cardPaddingClass}>
        <CardHeader
          title="Console logs"
          domain={domain}
          subtitle="Latest console output forwarded by the instrumented application."
          icon={<TerminalIcon className="h-4.5 w-4.5" />}
          action={
            <div className="flex items-center gap-2">
              <select
                aria-label="Log level"
                value={level}
                onChange={(event) => setLevel(event.target.value as LevelFilter)}
                className={controlClass}
              >
                {levelFilters.map((filter) => (
                  <option
                    key={filter.value}
                    value={filter.value}
                    className="bg-white text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                  >
                    {filter.label}
                  </option>
                ))}
              </select>
              <select
                aria-label="Number of log entries"
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className={controlClass}
              >
                {limitOptions.map((option) => (
                  <option
                    key={option}
                    value={option}
                    className="bg-white text-stone-800 dark:bg-stone-800 dark:text-stone-200"
                  >
                    {option} entries
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {isLoading ? (
          <TableSkeleton rows={6} columns={3} />
        ) : isError ? (
          <ErrorState title="Could not load console logs" message={errorMessage(error)} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={<TerminalIcon className="h-5 w-5" />}
            title="No console logs"
            description={
              <>
                No console output was forwarded for{" "}
                <span className="font-medium text-stone-700 dark:text-stone-300">{domain}</span>
                {level === "all" ? "" : ` at level ${level}`}.
              </>
            }
          />
        ) : (
          <div
            role="region"
            aria-label="Console log entries"
            tabIndex={0}
            className="-mx-4 max-h-[28rem] overflow-y-auto sm:-mx-6 lg:-mx-7"
          >
            <ul className="divide-y divide-stone-500/10 dark:divide-white/5">
              {entries.map((entry, index) => (
                <LogEntry key={`${entry.timestamp}-${index}`} entry={entry} />
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
