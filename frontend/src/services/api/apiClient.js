import api from '../api';

console.log('[apiClient.js] Module loading...');
console.log('[apiClient.js] Re-exporting canonical api from ../api');

const apiClient = api;

console.log('[apiClient.js] Axios instance baseURL:', apiClient.defaults.baseURL);
console.log('[apiClient.js] Using interceptors from canonical api instance');

export default apiClient;
