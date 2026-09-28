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
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./LoginPage";
import { StatsDashboard } from "./StatsDashboard";
import { TimeSeries } from "./TimeSeries";
import Header from "./Header.tsx";
import Footer from "./Footer.tsx";
import { UserAgentStatsTable } from "./UserAgentStatsTable.tsx";
import { ThemeProvider } from "./ThemeContext.tsx";
import { ScreenSizeStatsTable } from "./ScreenSizeStatsTable.tsx";
import { RouteStatsTable } from "./RouteStatsTable.tsx";

const DOMAIN_COOKIE_KEY = "symbanta_selected_domain";

function getCookie(name: string): string {
  const match: RegExpMatchArray | null = document.cookie.match(
    new RegExp("(^| )" + name + "=([^;]+)"),
  );
  // @ts-ignore
  return match ? decodeURIComponent(match[2]) : "";
}

function setCookie(name: string, value: string, days = 365): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(400 * 2 ** attemptIndex, 1000),
    },
  },
  queryCache: new QueryCache({
    onError: (error: any) => {
      const status = error?.status || error?.response?.status;
      if (status === 401 || status === 403) {
        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }
      } else if (status === 500) {
        console.error(error);
      }
    },
  }),
});

function DashboardLayout() {
  const [selectedDomain, setSelectedDomainState] = useState<string>(() =>
    getCookie(DOMAIN_COOKIE_KEY),
  );

  const handleSelectDomain = (domain: string) => {
    setSelectedDomainState(domain);
    setCookie(DOMAIN_COOKIE_KEY, domain);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Header selectedDomain={selectedDomain} onSelectDomain={handleSelectDomain} />
      <StatsDashboard domain={selectedDomain} />
      <TimeSeries domain={selectedDomain} />
      <div className="flex flex-row flex-wrap gap-3 align-center items-center">
        <UserAgentStatsTable domain={selectedDomain} />
        <ScreenSizeStatsTable domain={selectedDomain} />
        <RouteStatsTable domain={selectedDomain} />
      </div>
      <Footer />
    </div>
  );
}

function LoginLayout() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <Header />
      <LoginPage />
      <Footer />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors">
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginLayout />} />
              <Route path="/" element={<DashboardLayout />} />
            </Routes>
          </BrowserRouter>
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
