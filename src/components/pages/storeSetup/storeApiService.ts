import { axiosInstance } from "../../../api-client/axiosHttpClient";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface StoreResponse {
  id: number;
  storeName: string;
  ownerEmail: string;
}

export const getMyStore = async () => {
  return axiosInstance.get<StoreResponse>(`${backendUrl}/app-one-backend/stores/me`);
};

export const createStore = async (storeName: string) => {
  return axiosInstance.post(`${backendUrl}/app-one-backend/stores`, { storeName });
};

export const updateStore = async (storeName: string) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/stores/me`, { storeName });
};
