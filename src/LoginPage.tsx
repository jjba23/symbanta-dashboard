// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useLogin } from "./api/symbanta";
import { useI18n } from "./i18n/I18nContext.tsx";

export function LoginPage() {
  const { t } = useI18n();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const loginMutation = useLogin({
    // @ts-ignore
    fetch: {
      credentials: "include", // Mandates sending session cookies (JSESSIONID)
    },
    mutation: {
      onSuccess: (response) => {
        if (response.status === 200) {
          queryClient.invalidateQueries().then((r) => console.log(`${r}`));
          navigate("/", { replace: true });
        }
      },
    },
  });

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      data: { username, password },
    });
  };

  // Extract error message from 401 ProblemDetails response or fetch network failure
  const isUnauthorized = loginMutation.data?.status === 401;
  const errorMessage = isUnauthorized
    ? (loginMutation.data?.data as { detail?: string; title?: string })?.detail ||
      (loginMutation.data?.data as { detail?: string; title?: string })?.title ||
      t("Invalid username or password")
    : loginMutation.isError
      ? (loginMutation.error as unknown as Error).message
      : null;

  return (
    <div className="flex flex-1 items-center justify-center py-8 sm:py-16">
      <div className="glass w-full max-w-sm rounded-3xl p-6 transition-shadow sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50">
            {t("Welcome back")}
          </h1>
          <p className="mt-1 text-xs text-stone-600 sm:text-sm dark:text-stone-400">
            {t("Sign in to access your analytics.")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400"
            >
              {t("Username")}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              className="glass-control w-full cursor-text rounded-xl px-3.5 py-2.5 text-sm text-stone-800 transition-[background,box-shadow] placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-stone-100 dark:placeholder:text-stone-400"
              placeholder={t("Enter username")}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400"
            >
              {t("Password")}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="glass-control w-full cursor-text rounded-xl px-3.5 py-2.5 text-sm text-stone-800 transition-[background,box-shadow] placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-stone-100 dark:placeholder:text-stone-400"
              placeholder="••••••••"
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-rose-300/50 bg-rose-50/80 px-3 py-2 text-xs font-medium text-rose-700 backdrop-blur-sm dark:border-rose-500/25 dark:bg-rose-950/40 dark:text-rose-300"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="btn-primary mt-1 w-full rounded-xl py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            {loginMutation.isPending ? t("Signing in…") : t("Sign in")}
          </button>
        </form>
      </div>
    </div>
  );
}
