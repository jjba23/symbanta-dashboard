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

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useLogin } from "./api/symbanta";

export function LoginPage() {
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
      "Invalid username or password"
    : loginMutation.isError
      ? (loginMutation.error as unknown as Error).message
      : null;

  return (
    <div className="flex flex-1 items-center justify-center py-8 sm:py-14">
      <div className="w-full max-w-md rounded-3xl border border-stone-200/70 bg-white p-6 shadow-sm shadow-stone-200/50 transition-colors sm:p-8 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none">
        <div className="mb-6">
          <h2 className="text-xl font-bold tracking-tight text-stone-800 sm:text-2xl dark:text-stone-100">
            Welcome back
          </h2>
          <p className="mt-1 text-xs text-stone-500 sm:text-sm dark:text-stone-400">
            Sign in to access your analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-400"
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              autoFocus
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 transition-colors placeholder:text-stone-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:ring-rose-500/40"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-semibold text-stone-600 dark:text-stone-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-800 transition-colors placeholder:text-stone-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:ring-rose-500/40"
              placeholder="••••••••"
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400"
            >
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="mt-1 w-full rounded-xl bg-rose-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-600 dark:focus-visible:ring-offset-stone-900 dark:hover:bg-rose-500"
          >
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
