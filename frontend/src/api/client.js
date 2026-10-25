import axios from 'axios';

import { loadSession } from '../utils/users';

export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

api.interceptors.request.use((config) => {
    const session = loadSession();

    if (session?.token) {
        config.headers.Authorization = `Token ${session.token}`;
    }

    return config;
});

export default api;
