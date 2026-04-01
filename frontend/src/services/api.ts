import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

export const api = axios.create({ baseURL: API_BASE });

export const setAuthHeader = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};
