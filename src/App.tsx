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
import { PeriodProvider } from "./PeriodContext.tsx";
import { DashboardToolbar } from "./DashboardToolbar.tsx";
import { EventStatsTable } from "./EventStatsTable.tsx";
import { CountryStatsTable } from "./CountryStatsTable.tsx";
import { ConsoleLogs } from "./ConsoleLogs.tsx";
import { EventTypesPanel } from "./EventTypesPanel.tsx";

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
    <PeriodProvider>
      <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-4 px-4 pt-4 pb-6 sm:gap-5 sm:px-6 sm:pt-6 lg:gap-6 lg:px-8 lg:pt-7">
        <Header selectedDomain={selectedDomain} onSelectDomain={handleSelectDomain} />
        <DashboardToolbar />
        <StatsDashboard domain={selectedDomain} />
        <TimeSeries domain={selectedDomain} />
        <div className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-2 lg:gap-6">
          <UserAgentStatsTable domain={selectedDomain} />
          <ScreenSizeStatsTable domain={selectedDomain} />
          <EventStatsTable domain={selectedDomain} />
          <CountryStatsTable domain={selectedDomain} />
          <RouteStatsTable domain={selectedDomain} className="xl:col-span-2" />
        </div>
        <ConsoleLogs domain={selectedDomain} />
        <EventTypesPanel domain={selectedDomain} />
        <Footer />
      </div>
    </PeriodProvider>
  );
}

function LoginLayout() {
  return (
    <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-5 px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-7">
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
        <div className="relative min-h-dvh text-stone-900 transition-colors dark:text-stone-100">
          {/* Wallpaper the frosted panels refract */}
          <div aria-hidden="true" className="app-wallpaper" />
          <div className="relative z-10">
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginLayout />} />
                <Route path="/" element={<DashboardLayout />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
