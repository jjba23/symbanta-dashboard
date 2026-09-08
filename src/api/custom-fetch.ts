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


export const customFetch = async <T>(
    url: string,
    options: RequestInit = {}
): Promise<T> => {
    const response = await fetch(url, {
        ...options,
        credentials: 'include', // Automatically sends JSESSIONID cookie on all requests
    });

    const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
    const body = [204, 205, 304].includes(response.status) ? null : await response.text();
    const data = body ? (contentType.includes('json') ? JSON.parse(body) : body) : {};

    if (!response.ok) {
        throw {status: response.status, data};
    }

    return {data, status: response.status, headers: response.headers} as T;
};

export default customFetch;