import { axiosInstance } from "../../../api-client/axiosHttpClient";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface TopSeller {
  productName: string;
  quantitySold: number;
  totalRevenue: number | null;
}

export interface DailySummary {
  date: string;
  revenue: number;
  productProfit: number;
  totalExpenses: number;
  actualProfit: number;
  transactionCount: number;
  itemsSold: number;
  topSellers: TopSeller[];
  topByRevenue: TopSeller[];
}

export const getDailySummary = async (date?: string) => {
  const queryParams = new URLSearchParams();
  if (date) queryParams.append("date", date);
  return axiosInstance.get<DailySummary>(`${backendUrl}/app-one-backend/reports/daily-summary?${queryParams}`);
};
