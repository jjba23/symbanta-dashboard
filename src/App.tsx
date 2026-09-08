import {StatsDashboard} from "./StatsDashboard.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {TimeSeries} from "./TimeSeries.tsx";

const queryClient = new QueryClient();

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            {/* Added a warm background, nice default text color, and full minimum height */}
            <div className="min-h-screen bg-stone-50 text-stone-800 font-sans selection:bg-rose-200">
                <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6 lg:px-8">

                    <header className="mb-10">
                        <h1 className="text-4xl font-extrabold tracking-tight text-stone-900 flex items-center gap-3">
                            Symbanta 🌿
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