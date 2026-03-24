import { axiosInstance } from "../../../api-client/axiosHttpClient";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface SaleItemResponse {
  id: number;
  productId: number | null;
  productName: string;
  sellingPriceAtSale: number;
  costPriceAtSale: number;
  quantity: number;
  subtotal: number;
  profit: number;
}

export interface SaleResponse {
  id: number;
  saleNumber: number;
  saleDate: string;
  totalAmount: number;
  totalProfit: number;
  totalItems: number;
  status: string;
  voidedAt: string | null;
  items: SaleItemResponse[];
  createdAt: string;
}

export const createSale = async (data: {
  saleDate: string;
  items: { productId: number; quantity: number }[];
}) => {
  return axiosInstance.post<SaleResponse>(`${backendUrl}/app-one-backend/sales`, data);
};

export const searchSales = async (params: { page?: number; size?: number; date?: string }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params.page ?? 0));
  queryParams.append("size", String(params.size ?? 20));
  if (params.date) queryParams.append("date", params.date);
  return axiosInstance.get(`${backendUrl}/app-one-backend/sales?${queryParams}`);
};

export const getSale = async (id: number) => {
  return axiosInstance.get<SaleResponse>(`${backendUrl}/app-one-backend/sales/${id}`);
};

export const voidSale = async (id: number, localDate: string) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/sales/${id}/void`, { localDate });
};
