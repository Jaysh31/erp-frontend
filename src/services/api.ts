import axios from "axios";
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { storage } from "../utils/storage";
 
//export baseURL separately
// export const baseURL = 'http://localhost:7200/api';

export const baseURL = 'https://erp.sculptortechpvtltd.com/api';
 
export const imageBaseURL = `${baseURL}/getmedia/`;
 
// Create axios instance
const api: AxiosInstance = axios.create({
    baseURL: baseURL,
});
 
// Request interceptor
 
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = storage.getToken();   
 
    if (token && config.headers) {
      config.headers['Authorization'] = token;
    }
 
    return config;
  },
  (error) => Promise.reject(error)
);
 
export default api;  