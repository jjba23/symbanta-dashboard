// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useEffect } from "react";

export const APP_NAME = "symbanta";

/**
 * Keep `document.title` in sync with the route (WCAG 2.4.2 Page Titled) so
 * screen-reader users get an accurate page name when the SPA navigates.
 * The title *never* moves focus, so announcements stay polite.
 */
export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title === APP_NAME ? APP_NAME : `${title} · ${APP_NAME}`;
  }, [title]);
}
