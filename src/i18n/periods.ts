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
