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

import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
    plugins: [react(), tailwindcss()],
    // server: {
    //     proxy: {
    //         '/api': {
    //             target: 'http://localhost:8080',
    //             changeOrigin: true,
    //         },
    //         '/v1': {
    //             target: 'http://localhost:8080',
    //             changeOrigin: true,
    //         },
    //     },
    // },
});
