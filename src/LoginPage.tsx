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

import React, {useState} from 'react';
import {useQueryClient} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {useLogin} from './api/symbanta';

export function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const queryClient = useQueryClient();
    const navigate = useNavigate();


    const loginMutation = useLogin({
        // @ts-ignore
        fetch: {
            credentials: 'include', // Mandates sending session cookies (JSESSIONID)
        },
        mutation: {
            onSuccess: (response) => {
                if (response.status === 200) {
                    queryClient.invalidateQueries().then((r) => console.log(`${r}`));
                    navigate('/', {replace: true});
                }
            },
        },
    });

    const handleSubmit = (e: React.SubmitEvent) => {
        e.preventDefault();
        loginMutation.mutate({
            data: {username, password},
        });
    };

    // Extract error message from 401 ProblemDetails response or fetch network failure
    const isUnauthorized = loginMutation.data?.status === 401;
    const errorMessage = isUnauthorized
        ? (loginMutation.data?.data as { detail?: string; title?: string })?.detail ||
        (loginMutation.data?.data as { detail?: string; title?: string })?.title ||
        'Invalid username or password'
        : loginMutation.isError
            ? (loginMutation.error as unknown as Error).message
            : null;

    return (
        <div className="min-h-160 flex items-center justify-center p-8">
            <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-sm border border-stone-200/60">
                <h2 className="text-2xl font-bold text-stone-800 mb-2">Welcome Back</h2>

                <p className="text-sm text-stone-500 mb-6 flex items-center gap-1.5">
                    Sign in to access analytics
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                    {errorMessage && (
                        <p className="text-xs text-rose-500 font-medium">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loginMutation.isPending}
                        className="w-full mt-2 bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm py-2.5 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}