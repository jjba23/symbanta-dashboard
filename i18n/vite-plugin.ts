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

import { readFileSync } from "node:fs";
import type { Plugin } from "vite";
import { compileCatalog } from "./po.ts";

/**
 * Vite plugin that turns `.po` catalogs into plain ES modules:
 *
 *   import es from "./locales/es.po"
 *   // → { headers: {...}, messages: {...} }
 *
 * Compiling at build time keeps `gettext-parser` out of the browser bundle —
 * the runtime only ever sees a lookup table — while the sources stay real GNU
 * gettext catalogs that translators can open in Poedit or Weblate.
 *
 * Changing a `.po` file in dev hot-updates the module: `src/i18n/locale.ts`
 * imports the catalogs through `import.meta.glob`, so Vite tracks them.
 */
export function gettextPlugin(): Plugin {
  return {
    name: "symbanta:gettext",
    enforce: "pre",
    load(id) {
      const file = id.split("?")[0] ?? "";
      if (!file.endsWith(".po")) return null;

      const catalog = compileCatalog(readFileSync(file, "utf8"));

      return {
        code: `export default ${JSON.stringify(catalog)};`,
        map: null,
      };
    },
  };
}
