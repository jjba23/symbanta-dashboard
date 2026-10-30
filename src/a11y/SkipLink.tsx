// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useI18n } from "../i18n/I18nContext.tsx";

/**
 * Keyboard-only escape hatch past the header and the sticky filter bar
 * (WCAG 2.4.1 Bypass Blocks). It is the first focusable element on the page and
 * slides into view with the same sprung easing as the rest of the chrome.
 */
export function SkipLink({ targetId = "main-content" }: { targetId?: string }) {
  const { t } = useI18n();

  return (
    <a href={`#${targetId}`} className="skip-link">
      <svg
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
      {t("Skip to the analytics")}
    </a>
  );
}
