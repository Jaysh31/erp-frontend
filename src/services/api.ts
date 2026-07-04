import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
 
//export baseURL separately
export const baseURL = 'https://erp.sculptortechpvtltd.com/api';
 
export const imageBaseURL = `${baseURL}/getmedia/`;
 
// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: baseURL,
});
 
// Request interceptor
 
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
 
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
 
    return config;
  },
  (error) => Promise.reject(error)
);
 
export default api;  