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

import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetEventTypesQueryKey,
  useGetEventTypes,
  useRegisterEventType,
} from "./api/symbanta.ts";
import type { V1EventTypesResponse } from "./api/model";
import { errorMessage, formattedDate } from "./Prelude.ts";
import { useI18n } from "./i18n/I18nContext.tsx";
import {
  BookmarkIcon,
  Card,
  CardHeader,
  cardPaddingClass,
  controlClass,
  EmptyState,
  ErrorState,
  Spinner,
  TableSkeleton,
} from "./ui.tsx";

interface EventTypesPanelProps {
  domain?: string;
  className?: string;
}

// Escaped `-` and `:` so the pattern is valid under the `v` (Unicode sets) flag browsers use.
const eventNamePattern = "[A-Za-z0-9._:\\-]{1,120}";

/**
 * Registry of the event names an application emits.
 *
 * Page views register themselves as they arrive; custom business events can be
 * declared up front so the dashboard and the emitted payloads agree on a name.
 * Registration is idempotent, so re-submitting an existing name is harmless.
 * Not period-scoped: this is configuration, not analytics.
 */
export function EventTypesPanel({ domain = "localhost", className }: EventTypesPanelProps) {
  const { t, tn, locale } = useI18n();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useGetEventTypes({ domain });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const register = useRegisterEventType({
    mutation: {
      onSuccess: () => {
        setName("");
        setDescription("");
        void queryClient.invalidateQueries({ queryKey: getGetEventTypesQueryKey({ domain }) });
      },
    },
  });

  const response = data?.data as V1EventTypesResponse | undefined;
  const eventTypes = [...(response?.eventTypes ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  const canSubmit = name.trim().length > 0 && !register.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    register.mutate({
      data: {
        domain,
        name: name.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      },
    });
  };

  return (
    <Card className={className}>
      <div className={cardPaddingClass}>
        <CardHeader
          title={t("Event types")}
          domain={domain}
          subtitle={t("Declare the event names this application emits.")}
          icon={<BookmarkIcon className="h-4.5 w-4.5" />}
          action={
            <span className="glass-inset rounded-full px-2.5 py-1 text-[11px] font-medium text-stone-600 dark:text-stone-300">
              {tn(
                "{count} registered event type",
                "{count} registered event types",
                eventTypes.length,
              )}
            </span>
          }
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            {isLoading ? (
              <TableSkeleton rows={4} columns={3} />
            ) : isError ? (
              <ErrorState
                title={t("Could not load event types")}
                message={errorMessage(error, t("An unknown error occurred"))}
              />
            ) : eventTypes.length === 0 ? (
              <EmptyState
                icon={<BookmarkIcon className="h-5 w-5" />}
                title={t("No event types registered")}
                description={t(
                  "Nothing has been declared for {domain} yet. Page views appear here automatically as they are ingested.",
                  { domain },
                )}
              />
            ) : (
              <ul className="-mx-4 max-h-[22rem] divide-y divide-stone-500/10 overflow-y-auto sm:-mx-6 dark:divide-white/5">
                {eventTypes.map((eventType) => (
                  <li
                    key={eventType.id}
                    className="flex flex-col gap-1 px-4 py-2.5 sm:px-6 lg:px-7"
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <span
                        className="truncate font-mono text-xs font-semibold text-stone-800 dark:text-stone-200"
                        title={eventType.name}
                      >
                        {eventType.name}
                      </span>
                      <time
                        dateTime={eventType.createdAt}
                        className="text-[11px] whitespace-nowrap text-stone-500 dark:text-stone-400"
                      >
                        {formattedDate(new Date(eventType.createdAt), locale)}
                      </time>
                    </div>
                    {eventType.description && (
                      <p className="text-xs leading-relaxed text-stone-500 dark:text-stone-400">
                        {eventType.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={handleSubmit} className="glass-inset flex flex-col gap-3 rounded-2xl p-4">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="event-type-name"
                className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400"
              >
                {t("Event name")}
              </label>
              <input
                id="event-type-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="signup-click"
                required
                maxLength={120}
                pattern={eventNamePattern}
                title={t("1-120 letters, digits or - _ . : characters")}
                className={`${controlClass} cursor-text font-mono`}
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="event-type-description"
                className="text-[10px] font-semibold tracking-wider text-stone-500 uppercase dark:text-stone-400"
              >
                {t("Description")} <span className="normal-case">{t("(optional)")}</span>
              </label>
              <input
                id="event-type-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("User completed the signup form")}
                maxLength={500}
                className={`${controlClass} cursor-text`}
              />
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              aria-busy={register.isPending}
              className="btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
            >
              {register.isPending && <Spinner className="h-3.5 w-3.5" />}
              <span>{register.isPending ? t("Registering…") : t("Register event type")}</span>
            </button>

            {register.isError && (
              <p role="alert" className="text-xs break-words text-rose-700 dark:text-rose-400">
                {errorMessage(register.error, t("An unknown error occurred"))}
              </p>
            )}
            {register.isSuccess && register.data && "name" in register.data.data && (
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {t("Registered {name}.", { name: register.data.data.name })}
              </p>
            )}
          </form>
        </div>
      </div>
    </Card>
  );
}
