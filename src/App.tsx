import { StatsDashboard } from "./StatsDashboard.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <div className="py-4 px-2">
          <h1 className="font-bold text-orange-700">Symbanta Dashboard</h1>
          <StatsDashboard />
        </div>
      </QueryClientProvider>
    </>
  );
}

export default App;
