import axios from "axios";
import { acquireAccessToken } from "../security-oauth2/azureMsal";

//https://axios-http.com/docs/instance
export const axiosInstance = axios.create();

//https://axios-http.com/docs/interceptors
axiosInstance.interceptors.request.use(async (config) => {
  const accessToken = await acquireAccessToken();
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});
