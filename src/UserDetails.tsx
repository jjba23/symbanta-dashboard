// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useGetCurrentUser } from "./api/symbanta";
import type { AuthResponse } from "./api/model";
import { useI18n } from "./i18n/I18nContext.tsx";

export function UserDetails() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGetCurrentUser();

  const userResponse = data?.data as AuthResponse | undefined;

  if (isLoading) {
    return (
      <div className="glass-inset inline-flex h-9 animate-pulse items-center gap-2 rounded-xl px-2.5 text-xs text-stone-500 dark:text-stone-400">
        <div className="h-1.5 w-1.5 rounded-full bg-stone-400/60 dark:bg-stone-600" />
        <span className="hidden sm:inline">{t("Loading…")}</span>
        <span className="sr-only sm:hidden">{t("Loading user")}</span>
      </div>
    );
  }

  if (isError || !userResponse) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-red-300/50 bg-red-50/80 px-2.5 text-xs font-medium text-red-600 backdrop-blur-sm dark:border-red-500/25 dark:bg-red-950/40 dark:text-red-300">
        <span className="hidden sm:inline">{t("Failed to load user")}</span>
        <span className="sr-only sm:hidden">{t("Failed to load user")}</span>
      </div>
    );
  }

  return (
    <div className="glass-inset inline-flex h-9 min-w-0 items-center gap-2 rounded-xl px-2.5 text-xs">
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400" />
        <span className="max-w-[7rem] truncate font-semibold text-stone-700 sm:max-w-[10rem] dark:text-stone-200">
          {userResponse.username}
        </span>
      </span>

      <span
        aria-hidden="true"
        className="font-normal text-stone-400 select-none dark:text-stone-600"
      >
        •
      </span>

      <span className="hidden rounded-md bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-stone-600 uppercase ring-1 ring-white/70 ring-inset sm:inline dark:bg-white/10 dark:text-stone-300 dark:ring-white/10">
        {userResponse.role}
      </span>
    </div>
  );
}
