/*added by mataha
* a simple fetcher function to be used with SWR 
*/
export const fetcher = (url: string) => fetch(url).then((res) => res.json());