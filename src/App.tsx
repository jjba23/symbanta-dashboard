import {StatsDashboard} from "./StatsDashboard.tsx";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {TimeSeries} from "./TimeSeries.tsx";

const queryClient = new QueryClient();

function App() {
    return (
        <>
            <QueryClientProvider client={queryClient}>
                <div className="py-4 px-2">
                    <h1 className="text-3xl text-purple-700">Symbanta Dashboard</h1>
                    <div className="mt-8 flex flex-col gap-8">
                        <StatsDashboard/>
                        <TimeSeries/>
                    </div>
                </div>
            </QueryClientProvider>
        </>
    );
}

export default App;
