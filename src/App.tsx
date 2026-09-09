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

import {BrowserRouter, Route, Routes} from 'react-router-dom';
import {QueryCache, QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {LoginPage} from './LoginPage';
import {StatsDashboard} from './StatsDashboard';
import {TimeSeries} from './TimeSeries';
import Header from "./Header.tsx";
import {DomainSwitcher} from "./DomainSwitcher.tsx";
import {useState} from "react";

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: (error: any) => {
            const status = error?.status || error?.response?.status;
            if (status === 401 || status === 403) {
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }
        },
    }),
});

function DashboardLayout() {
    const [selectedDomain, setSelectedDomain] = useState('');
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <Header/>
            <DomainSwitcher onSelectDomain={setSelectedDomain} selectedDomain={selectedDomain}/>
            <StatsDashboard domain={selectedDomain}/>
            <TimeSeries domain={selectedDomain}/>
        </div>
    );
}

function LoginLayout() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <Header/>
            <LoginPage/>
        </div>
    );
}


function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<LoginLayout/>}/>
                    <Route path="/" element={<DashboardLayout/>}/>
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}

export default App;