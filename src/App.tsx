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

import {StatsDashboard} from "./StatsDashboard.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {TimeSeries} from "./TimeSeries.tsx";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-rose-200">
                <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

                    <header className="mb-10">
                        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 flex items-center gap-3">
                            symbanta 🌿 Συμβάντα
                        </h1>
                        <p className="mt-2 text-base text-stone-500">
                            Your cozy, privacy-friendly analytics dashboard.
                        </p>
                    </header>

                    <main className="flex flex-col gap-8">
                        <StatsDashboard/>
                        <TimeSeries/>
                    </main>

                </div>
            </div>
        </QueryClientProvider>
    );
}

export default App;