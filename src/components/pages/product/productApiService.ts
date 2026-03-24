import { axiosInstance } from "../../../api-client/axiosHttpClient";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface ProductResponse {
  id: number;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
  categoryId: number | null;
  categoryName: string | null;
  isFavorite: boolean;
  isLowStock: boolean;
}

export interface SearchResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

export interface CategoryResponse {
  id: number;
  name: string;
  productCount: number;
}

export const searchProducts = async (params: {
  page?: number;
  size?: number;
  search?: string;
  categoryId?: number | null;
  favoritesOnly?: boolean;
  lowStockOnly?: boolean;
  sortBy?: string;
}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("page", String(params.page ?? 0));
  queryParams.append("size", String(params.size ?? 20));
  if (params.search) queryParams.append("search", params.search);
  if (params.categoryId) queryParams.append("categoryId", String(params.categoryId));
  if (params.favoritesOnly) queryParams.append("favoritesOnly", "true");
  if (params.lowStockOnly) queryParams.append("lowStockOnly", "true");
  if (params.sortBy) queryParams.append("sortBy", params.sortBy);
  return axiosInstance.get<SearchResult<ProductResponse>>(`${backendUrl}/app-one-backend/products?${queryParams}`);
};

export const getProduct = async (id: number) => {
  return axiosInstance.get<ProductResponse>(`${backendUrl}/app-one-backend/products/${id}`);
};

export const createProduct = async (data: {
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
  categoryId: number | null;
  isFavorite: boolean;
}) => {
  return axiosInstance.post(`${backendUrl}/app-one-backend/products`, data);
};

export const updateProduct = async (id: number, data: {
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  lowStockThreshold: number;
  categoryId: number | null;
  isFavorite: boolean;
}) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/products/${id}`, data);
};

export const deleteProduct = async (id: number) => {
  return axiosInstance.delete(`${backendUrl}/app-one-backend/products/${id}`);
};

export const restockProduct = async (id: number, data: { addQuantity: number; newCostPrice?: number | null }) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/products/${id}/restock`, data);
};

export const getCategories = async () => {
  return axiosInstance.get<CategoryResponse[]>(`${backendUrl}/app-one-backend/categories`);
};

export const createCategory = async (name: string) => {
  return axiosInstance.post(`${backendUrl}/app-one-backend/categories`, { name });
};

export const updateCategory = async (id: number, name: string) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/categories/${id}`, { name });
};

export const deleteCategory = async (id: number) => {
  return axiosInstance.delete(`${backendUrl}/app-one-backend/categories/${id}`);
};

export interface PriceChangePreview {
  productId: number;
  productName: string;
  currentSellingPrice: number;
  newSellingPrice: number;
  currentCostPrice: number;
  newCostPrice: number;
}

export interface BulkPricePreviewResponse {
  previews: PriceChangePreview[];
}

export const bulkPriceAdjust = async (data: {
  productIds: number[];
  selectAll: boolean;
  categoryId: number | null;
  search: string | null;
  sellingPriceAction: string;
  sellingPriceAmount: number;
  costPriceAction: string;
  costPriceAmount: number;
  preview: boolean;
}) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/products/bulk-price`, data);
};
