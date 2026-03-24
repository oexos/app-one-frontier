import { axiosInstance } from "../../../api-client/axiosHttpClient";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface ExpenseResponse {
  id: number;
  description: string;
  amount: number;
  expenseDate: string;
  createdAt: string;
}

export interface SearchResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

export const searchExpenses = async (params: { page?: number; size?: number }) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params.page ?? 0));
  queryParams.append("size", String(params.size ?? 20));
  return axiosInstance.get<SearchResult<ExpenseResponse>>(`${backendUrl}/app-one-backend/expenses?${queryParams}`);
};

export const createExpense = async (data: { description: string; amount: number; expenseDate: string }) => {
  return axiosInstance.post(`${backendUrl}/app-one-backend/expenses`, data);
};

export const updateExpense = async (id: number, data: { description: string; amount: number; expenseDate: string }) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/expenses/${id}`, data);
};

export const deleteExpense = async (id: number) => {
  return axiosInstance.delete(`${backendUrl}/app-one-backend/expenses/${id}`);
};
