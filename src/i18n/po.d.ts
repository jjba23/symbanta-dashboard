// symbanta-dashboard
//
// SPDX-License-Identifier: MIT
// Copyright © Josep Bigorra <jjbigorra@gmail.com>

declare module "*.po" {
  import type { CompiledCatalog } from "./catalog.ts";

  const catalog: CompiledCatalog;
  export default catalog;
}
