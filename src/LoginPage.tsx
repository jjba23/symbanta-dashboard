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
    <div className="flex flex-1 items-center justify-center py-8 sm:py-16">
      <div className="glass w-full max-w-sm rounded-3xl p-6 transition-shadow sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl dark:text-stone-50">
            Welcome back
          </h1>
          <p className="mt-1 text-xs text-stone-600 sm:text-sm dark:text-stone-400">
            Sign in to access your analytics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="username"
              className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400"
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
              className="glass-control w-full cursor-text rounded-xl px-3.5 py-2.5 text-sm text-stone-800 transition-[background,box-shadow] placeholder:text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 dark:text-stone-100 dark:placeholder:text-stone-400"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-[11px] font-semibold tracking-wide text-stone-500 uppercase dark:text-stone-400"
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
            {loginMutation.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
