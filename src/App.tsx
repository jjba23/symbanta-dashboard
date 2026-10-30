// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

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
import { ContrastProvider } from "./a11y/ContrastContext.tsx";
import { SkipLink } from "./a11y/SkipLink.tsx";
import { I18nProvider, useI18n } from "./i18n/I18nContext.tsx";
import { useDocumentTitle } from "./a11y/useDocumentTitle.ts";

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
  const { t } = useI18n();

  useDocumentTitle(t("Analytics"));

  const handleSelectDomain = (domain: string) => {
    setSelectedDomainState(domain);
    setCookie(DOMAIN_COOKIE_KEY, domain);
  };

  return (
    <PeriodProvider>
      <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-4 px-4 pt-4 pb-6 sm:gap-5 sm:px-6 sm:pt-6 lg:gap-6 lg:px-8 lg:pt-7">
        <Header selectedDomain={selectedDomain} onSelectDomain={handleSelectDomain} />
        <main
          id="main-content"
          tabIndex={-1}
          className="flex flex-col gap-4 focus:outline-none sm:gap-5 lg:gap-6"
        >
          {/* The wordmark is the site banner; the page itself needs one h1. */}
          <h1 className="sr-only">
            {selectedDomain
              ? t("Analytics for {domain}", { domain: selectedDomain })
              : t("Analytics dashboard")}
          </h1>
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
        </main>
        <Footer />
      </div>
    </PeriodProvider>
  );
}

function LoginLayout() {
  const { t } = useI18n();

  useDocumentTitle(t("Sign in"));

  return (
    <div className="mx-auto flex w-full max-w-[86rem] flex-col gap-5 px-4 pt-4 pb-6 sm:px-6 sm:pt-6 lg:px-8 lg:pt-7">
      <Header />
      <main id="main-content" tabIndex={-1} className="flex flex-col gap-5 focus:outline-none">
        <LoginPage />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <I18nProvider>
      <ThemeProvider>
        <ContrastProvider>
          <QueryClientProvider client={queryClient}>
            <div className="relative min-h-dvh text-stone-900 transition-colors dark:text-stone-100">
              {/* Wallpaper the frosted panels refract */}
              <div aria-hidden="true" className="app-wallpaper" />
              <div className="relative z-10">
                <SkipLink />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<LoginLayout />} />
                    <Route path="/" element={<DashboardLayout />} />
                  </Routes>
                </BrowserRouter>
              </div>
            </div>
          </QueryClientProvider>
        </ContrastProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
