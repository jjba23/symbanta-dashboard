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

import { createContext, useContext, useId, type ReactNode } from "react";
import { Period } from "./api/model";
import { useI18n } from "./i18n/I18nContext.tsx";
import { periodLabel } from "./i18n/periods.ts";
import {
  formattedDate,
  formattedDateRange,
  formattedDateRangeShort,
  type PeriodType,
} from "./Prelude.ts";

/* -------------------------------------------------------------------------- */
/*  Shared class fragments                                                     */
/* -------------------------------------------------------------------------- */

/** Card surface used by every panel of the dashboard. */
export const cardClass = "@container glass w-full rounded-3xl transition-shadow duration-300";

/** Card inner padding, tuned per breakpoint. */
export const cardPaddingClass = "p-4 sm:p-6 lg:p-7";

/** Shared styling for the compact controls (selects, inputs, buttons). */
export const controlClass =
  "glass-control text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-200 px-3 py-1.5 rounded-xl cursor-pointer transition-[background,box-shadow] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:focus-visible:ring-rose-400/40";

/* -------------------------------------------------------------------------- */
/*  Icons                                                                      */
/* -------------------------------------------------------------------------- */

type IconProps = { className?: string | undefined };

const baseIconClass = "h-4 w-4 shrink-0";

function Icon({ className = baseIconClass, d }: IconProps & { d: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export const EyeIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z"
  />
);

export const UsersIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
  />
);

export const ClockIcon = ({ className }: IconProps) => (
  <Icon className={className} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
);

export const BounceIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M2.25 6L9 12.75l4.286-4.286a11.948 11.948 0 004.306 6.43l.776.539m0 0l-.001-4.5m.001 4.5h-4.5"
  />
);

export const ChartIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
  />
);

export const RouteIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
  />
);

export const MonitorIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
  />
);

export const GlobeIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3 7.5 7.03 7.5 12s2.015 9 4.5 9zM3.6 9h16.8M3.6 15h16.8"
  />
);

export const TagIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z M6 6h.008v.008H6V6z"
  />
);

export const TerminalIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
  />
);

export const BookmarkIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
  />
);

export const BrowserIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0a8.949 8.949 0 004.951-1.488A3.987 3.987 0 0013 16h-2a3.987 3.987 0 00-3.951 3.512A8.949 8.949 0 0012 21zm6.364-5.541a3 3 0 00-1.09-2.04 1.5 1.5 0 00-.98-.369H7.706a1.5 1.5 0 00-.98.369 3 3 0 00-1.09 2.04M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
  />
);

export const CalendarIcon = ({ className = "h-3.5 w-3.5 shrink-0" }: IconProps) => (
  <Icon
    className={className}
    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
  />
);

export const RefreshIcon = ({ className }: IconProps) => (
  <Icon
    className={className}
    d="M16.023 9.348h4.992V4.356m-4.992 4.992l3.181-3.183a8.25 8.25 0 00-13.803 3.7M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7"
  />
);

export const AlertIcon = ({ className = "h-4 w-4 shrink-0" }: IconProps) => (
  <Icon
    className={className}
    d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.731 0-2.814-1.874-1.948-3.374l7.352-12.732c.866-1.5 3.032-1.5 3.898 0l7.352 12.732zM12 15.75h.007v.008H12v-.008z"
  />
);

export const Spinner = ({ className = "h-4 w-4" }: IconProps) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-90"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a10 10 0 00-10 10h4z"
    />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Card shell + header                                                        */
/* -------------------------------------------------------------------------- */

/**
 * The panel heading id is generated by `Card` and consumed by `CardHeader`, so
 * every `<section>` is announced with its own title instead of an anonymous
 * "region". Panels rendered without a header (tests, embeds) simply have no
 * accessible name.
 */
const CardHeadingIdContext = createContext<string | undefined>(undefined);

export function Card({
  children,
  className = "",
  id,
}: {
  children: ReactNode;
  className?: string | undefined;
  id?: string | undefined;
}) {
  const headingId = useId();

  return (
    <section id={id} aria-labelledby={headingId} className={`${cardClass} ${className}`}>
      <CardHeadingIdContext.Provider value={headingId}>{children}</CardHeadingIdContext.Provider>
    </section>
  );
}

export function DomainBadge({ domain }: { domain: string }) {
  return (
    <span
      className="inline-flex max-w-[14rem] items-center truncate rounded-full bg-rose-500/10 px-2.5 py-0.5 align-middle text-sm font-semibold text-rose-700 ring-1 ring-rose-500/20 ring-inset backdrop-blur-sm sm:max-w-none dark:bg-rose-400/10 dark:text-rose-300 dark:ring-rose-400/20"
      title={domain}
    >
      {domain}
    </span>
  );
}

/**
 * Panel header: icon + title (+ subtitle) on the left, context chips and
 * actions on the right. Uses a container query so it responds to the width of
 * the card itself rather than the viewport (cards sit side by side on `xl`
 * screens, which is much narrower than the window).
 */
export function CardHeader({
  title,
  domain,
  subtitle,
  icon,
  action,
}: {
  title: string;
  domain?: string | undefined;
  subtitle?: string | undefined;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  const hasContext = Boolean(domain) || Boolean(action);
  const headingId = useContext(CardHeadingIdContext);

  return (
    <div className="mb-4 flex flex-col gap-2.5 @lg:mb-5 @lg:flex-row @lg:flex-wrap @lg:items-center @lg:justify-between @lg:gap-x-6 @lg:gap-y-2">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span
            aria-hidden="true"
            className="glass-inset hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-stone-500 sm:flex dark:text-stone-300"
          >
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2
            id={headingId}
            className="text-base font-bold tracking-tight text-stone-800 sm:text-lg @lg:text-xl dark:text-stone-100"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-stone-500 sm:text-[13px] dark:text-stone-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {hasContext && (
        <div className="flex flex-wrap items-center gap-2">
          {domain && <DomainBadge domain={domain} />}
          {action}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Controls                                                                   */
/* -------------------------------------------------------------------------- */

export function PeriodSelect({
  value,
  onChange,
  id,
  className = "",
}: {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
  id?: string;
  className?: string;
}) {
  const { t } = useI18n();

  return (
    <select
      id={id}
      aria-label={t("Reporting period")}
      value={value}
      onChange={(event) => onChange(event.target.value as PeriodType)}
      className={`${controlClass} ${className}`}
    >
      {Object.values(Period)
        .filter((period) => period !== Period.CUSTOM)
        .map((period) => (
          <option
            key={period}
            value={period}
            className="bg-white text-stone-800 dark:bg-stone-800 dark:text-stone-200"
          >
            {periodLabel(period, t)}
          </option>
        ))}
    </select>
  );
}

/** Compact date range pill; the full timestamps are available on hover. */
export function DateRangeBadge({ from, to }: { from: Date; to: Date }) {
  const { locale } = useI18n();

  // Within a single day the exact timestamps matter, otherwise the date span
  // is what people care about (and it keeps the header from wrapping).
  const sameDay = from.toDateString() === to.toDateString();
  const label = sameDay ? formattedDate(from, locale) : formattedDateRangeShort(from, to, locale);

  return (
    <div
      className="glass-inset inline-flex min-w-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-medium text-stone-600 sm:text-xs dark:text-stone-300"
      title={formattedDateRange(from, to, locale)}
    >
      <CalendarIcon />
      <span className="truncate whitespace-nowrap">{label}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  States                                                                     */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-2xl border border-dashed border-stone-400/30 bg-white/20 px-4 py-10 text-center sm:py-12 dark:border-white/10 dark:bg-white/[0.02]">
      <div
        aria-hidden="true"
        className="glass-inset mb-3 flex h-11 w-11 items-center justify-center rounded-2xl text-stone-500 dark:text-stone-400"
      >
        {icon}
      </div>
      <h3 className="mb-1 text-sm font-semibold text-stone-800 sm:text-base dark:text-stone-200">
        {title}
      </h3>
      <p className="max-w-xs text-xs leading-relaxed text-stone-500 dark:text-stone-400">
        {description}
      </p>
    </div>
  );
}

export function ErrorState({ title, message }: { title?: string; message: string }) {
  const { t } = useI18n();

  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border border-rose-300/50 bg-rose-50/70 px-4 py-3.5 text-sm text-rose-700 backdrop-blur-sm dark:border-rose-500/25 dark:bg-rose-950/40 dark:text-rose-300"
    >
      <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        <p className="font-semibold">{title ?? t("Something went wrong")}</p>
        <p className="mt-0.5 text-xs break-words opacity-90">{message}</p>
      </div>
    </div>
  );
}

/** Shimmer placeholder used while a panel is loading (keeps the layout stable). */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  const { t } = useI18n();

  return (
    <div className="animate-pulse space-y-3" role="status" aria-live="polite">
      <span className="sr-only">{t("Loading analytics…")}</span>
      <div className="flex gap-3">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="h-3 flex-1 rounded-full bg-stone-400/25 dark:bg-white/10"
            style={{ flexGrow: index === 0 ? 2.5 : 1 }}
          />
        ))}
      </div>
      <div className="space-y-2.5 border-t border-stone-500/10 pt-3 dark:border-white/5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-3">
            <div className="h-3.5 flex-[2.5] rounded-full bg-stone-400/20 dark:bg-white/[0.07]" />
            <div className="h-3.5 flex-1 rounded-full bg-stone-400/20 dark:bg-white/[0.07]" />
            <div className="hidden h-3.5 flex-1 rounded-full bg-stone-400/20 sm:block dark:bg-white/[0.07]" />
            <div className="h-3.5 w-12 rounded-full bg-stone-400/20 dark:bg-white/[0.07]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton({ count = 4 }: { count?: number }) {
  const { t } = useI18n();

  return (
    <div
      className="grid animate-pulse grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">{t("Loading summary…")}</span>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="glass-inset rounded-2xl p-4 sm:p-5">
          <div className="mb-3 h-3 w-2/3 rounded-full bg-stone-400/25 dark:bg-white/10" />
          <div className="h-6 w-1/2 rounded-lg bg-stone-400/25 dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Data table                                                                 */
/* -------------------------------------------------------------------------- */

export interface StatRow {
  label: string;
  pageViews: number;
  visitors: number;
}

function ShareBar({ percentage }: { percentage: number }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <div
        aria-hidden="true"
        className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-stone-500/15 md:block lg:w-20 dark:bg-white/10"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-500 shadow-[0_0_8px_rgb(244_63_94_/_0.45)] transition-[width] duration-500 ease-out dark:from-rose-400 dark:to-pink-400"
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      <span className="min-w-[2.75rem] text-right text-[11px] font-semibold tabular-nums text-stone-500 sm:text-xs dark:text-stone-400">
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
}

/**
 * Responsive breakdown table. Columns fold away on narrow screens (`Visitors`
 * below `sm`, the share bar below `md`) so no horizontal scrolling is needed,
 * and the label column truncates instead of pushing the numbers off screen.
 */
export function StatsTable({
  rows,
  labelHeader,
  emptyLabel = "Unknown",
  maxHeightClass = "max-h-[22rem]",
  viewsHeader = "Views",
}: {
  rows: StatRow[];
  labelHeader: string;
  emptyLabel?: string;
  maxHeightClass?: string;
  viewsHeader?: string;
}) {
  const { t } = useI18n();
  const total = rows.reduce((sum, row) => sum + row.pageViews, 0);

  return (
    <div
      role="region"
      aria-label={t("{label} breakdown", { label: labelHeader })}
      tabIndex={0}
      className={`-mx-4 overflow-y-auto sm:-mx-6 lg:-mx-7 ${maxHeightClass}`}
    >
      <table className="w-full table-fixed border-collapse text-left text-sm">
        <caption className="sr-only">
          {t("{label} breakdown: {views}, visitors and share of total.", {
            label: labelHeader,
            views: viewsHeader,
          })}
        </caption>
        <thead className="sticky top-0 z-10 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:bg-stone-900/80 dark:supports-[backdrop-filter]:bg-stone-900/60">
          <tr className="border-y border-white/70 text-[10px] font-semibold tracking-wider text-stone-500 uppercase sm:text-[11px] dark:border-white/[0.07] dark:text-stone-400">
            <th scope="col" className="px-4 py-2.5 font-semibold sm:px-6 lg:px-7">
              {labelHeader}
            </th>
            <th
              scope="col"
              className="w-20 px-2 py-2.5 text-right font-semibold whitespace-nowrap sm:w-24"
            >
              {viewsHeader}
            </th>
            <th
              scope="col"
              className="hidden w-24 px-2 py-2.5 text-right font-semibold whitespace-nowrap sm:table-cell"
            >
              {t("Visitors")}
            </th>
            <th
              scope="col"
              className="w-20 px-4 py-2.5 text-right font-semibold whitespace-nowrap sm:w-28 sm:px-6 lg:w-32 lg:px-7"
            >
              {t("Share")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-500/10 dark:divide-white/5">
          {rows.map((row, index) => {
            const percentage = total > 0 ? (row.pageViews / total) * 100 : 0;
            const label = row.label === "" ? emptyLabel : row.label;

            return (
              <tr
                key={`${label}-${index}`}
                className="group text-stone-700 transition-colors hover:bg-white/45 dark:text-stone-300 dark:hover:bg-white/[0.04]"
              >
                <td className="min-w-0 px-4 py-3 sm:px-6 lg:px-7">
                  <span
                    className="block truncate font-mono text-xs font-medium text-stone-800 transition-colors group-hover:text-rose-700 dark:text-stone-200 dark:group-hover:text-rose-400"
                    title={label}
                  >
                    {label}
                  </span>
                </td>
                <td className="px-2 py-3 text-right text-xs font-semibold whitespace-nowrap tabular-nums text-stone-800 sm:text-sm dark:text-stone-200">
                  {row.pageViews.toLocaleString()}
                </td>
                <td className="hidden px-2 py-3 text-right text-xs font-medium whitespace-nowrap tabular-nums text-stone-500 sm:table-cell sm:text-sm dark:text-stone-400">
                  {row.visitors.toLocaleString()}
                </td>
                <td className="px-4 py-3 sm:px-6 lg:px-7">
                  <ShareBar percentage={percentage} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
