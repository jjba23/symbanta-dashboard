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

import { useEffect, useMemo } from "react";
import { useGetProperties } from "./api/symbanta";
import type { V1PropertiesResponse, V1Property } from "./api/model";

interface DomainSwitcherProps {
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
}

export function DomainSwitcher({ selectedDomain, onSelectDomain }: DomainSwitcherProps) {
  const { data, isLoading, isError } = useGetProperties();

  const propertiesResponse = data?.data as V1PropertiesResponse | undefined;
  const properties: V1Property[] = useMemo(
    () => propertiesResponse?.properties ?? [],
    [propertiesResponse?.properties],
  );

  const firstDomain = properties[0]?.domain;

  // Auto-select the first available domain if none is currently selected
  useEffect(() => {
    if (!selectedDomain && firstDomain) {
      onSelectDomain(firstDomain);
    }
  }, [selectedDomain, firstDomain, onSelectDomain]);

  if (isLoading) {
    return (
      <div className="text-xs text-stone-400 animate-pulse px-3 py-2 bg-stone-100 rounded-xl">
        Loading properties...
      </div>
    );
  }

  if (isError || properties.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-stone-500">Domain:</span>
        <input
          type="text"
          value={selectedDomain}
          onChange={(e) => onSelectDomain(e.target.value)}
          placeholder="Enter domain..."
          className="text-sm font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-stone-500">Property:</span>
      <select
        value={selectedDomain}
        onChange={(e) => onSelectDomain(e.target.value)}
        className="text-sm font-medium text-stone-700 bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/80 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500/20"
      >
        {properties.map((prop) => (
          <option key={prop.id} value={prop.domain}>
            {prop.domain}
          </option>
        ))}
      </select>
    </div>
  );
}
