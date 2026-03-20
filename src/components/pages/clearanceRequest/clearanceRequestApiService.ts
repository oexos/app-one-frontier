import { axiosInstance } from "../../../api-client/axiosHttpClient";
import type { ResidentData } from "../register/registerApiService";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface ClearanceRequestData {
  id?: number;
  residentId: number;
  resident?: ResidentData;
  purpose: string;
  paymentReferenceNumber?: string;
  paymentAmount?: number;
  status?: string;
  clearanceNumber?: string;
  qrCodeData?: string;
  remarks?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ClearanceStatusUpdate {
  status: string;
  remarks?: string;
}

export const createClearanceRequest = async (data: ClearanceRequestData) => {
  return axiosInstance.post<ClearanceRequestData>(`${backendUrl}/app-one-backend/clearance-requests`, data);
};

export const searchClearanceRequests = async (params: {
  status?: string;
  residentId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}) => {
  return axiosInstance.get<{ items: ClearanceRequestData[]; totalCount: number }>(
    `${backendUrl}/app-one-backend/clearance-requests`,
    { params }
  );
};

export const getClearanceRequestById = async (id: number) => {
  return axiosInstance.get<ClearanceRequestData>(`${backendUrl}/app-one-backend/clearance-requests/${id}`);
};

export const updateClearanceRequestStatus = async (id: number, data: ClearanceStatusUpdate) => {
  return axiosInstance.patch<ClearanceRequestData>(
    `${backendUrl}/app-one-backend/clearance-requests/${id}/status`,
    data
  );
};
