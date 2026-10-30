// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { Period } from "../api/model";
import type { PeriodType } from "../Prelude.ts";
import type { Translator } from "./translate.ts";

/**
 * Translated reporting-period names.
 *
 * A `switch` rather than a lookup table on purpose: gettext can only extract
 * *static* msgids, so every label has to appear literally in the source.
 * The English strings are identical to `periodLabels` in `Prelude.ts`, which
 * keeps the source language and the extraction stable.
 */
export function periodLabel(period: PeriodType, t: Translator["t"]): string {
  switch (period) {
    case Period.TODAY:
      return t("Today");
    case Period.YESTERDAY:
      return t("Yesterday");
    case Period.LAST_24_HOURS:
      return t("Last 24 Hours");
    case Period.LAST_3_DAYS:
      return t("Last 3 Days");
    case Period.LAST_7_DAYS:
      return t("Last 7 Days");
    case Period.LAST_30_DAYS:
      return t("Last 30 Days");
    case Period.THIS_MONTH:
      return t("This month");
    case Period.LAST_MONTH:
      return t("Last month");
    case Period.LAST_6_MONTHS:
      return t("Last 6 Months");
    case Period.LAST_12_MONTHS:
      return t("Last 12 Months");
    case Period.THIS_YEAR:
      return t("This year");
    case Period.LAST_YEAR:
      return t("Last year");
    case Period.ALL_TIME:
      return t("All time");
    case Period.CUSTOM:
      return t("Custom");
    default:
      return period;
  }
}
