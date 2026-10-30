// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

import { useI18n } from "./i18n/I18nContext.tsx";
function Footer() {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-4 border-t border-stone-500/15 pt-6 pb-8 text-sm text-stone-500 sm:pt-8 sm:pb-12 dark:border-white/10 dark:text-stone-400">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between md:gap-6">
        {/* Left Section: Logo, Copyright & Contact */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <img
              src="https://jointhefreeworld.org/static-assets/symbanta/symbanta-small.png"
              alt=""
              className="h-5 w-5 shrink-0 object-contain"
            />
            <span className="font-bold tracking-tight text-stone-800 dark:text-stone-100">
              symbanta
            </span>
            <span aria-hidden="true" className="text-stone-400 dark:text-stone-600">
              •
            </span>
            <span className="text-stone-600 dark:text-stone-400">
              {t("© {year} Josep Bigorra", { year: currentYear })}
            </span>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400">
            {t("Contact:")}{" "}
            <a
              href="mailto:jjbigorra@gmail.com"
              className="underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-700 dark:decoration-stone-700 dark:hover:text-stone-300"
            >
              jjbigorra@gmail.com
            </a>
          </p>
        </div>

        {/* Right Section: License & Code Repository */}
        <div className="flex flex-col gap-1.5 text-xs text-stone-500 md:items-end dark:text-stone-400">
          <p className="flex flex-wrap items-center gap-1.5">
            <span>{t("Free Software under the")}</span>
            <a
              href="https://opensource.org/license/mit"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-2 transition-colors hover:text-stone-900 dark:text-stone-300 dark:decoration-stone-700 dark:hover:text-stone-100"
            >
              MIT License
            </a>
          </p>

          <p className="flex flex-wrap items-center gap-1.5">
            <span>{t("Source code:")}</span>
            <a
              href="https://codeberg.org/jjba23/symbanta-dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 break-all text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200"
            >
              codeberg.org/jjba23/symbanta-dashboard
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
