import { axiosInstance } from "../../../api-client/axiosHttpClient";
import type { ResidentData } from "../register/registerApiService";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface ComplaintData {
  id?: number;
  complainantId: number;
  complainant?: ResidentData;
  respondentName?: string;
  description: string;
  category: string;
  status?: string;
  attachmentUrls?: string;
  mediationDate?: string;
  resolution?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ComplaintStatusUpdate {
  status: string;
  mediationDate?: string;
  resolution?: string;
}

export const createComplaint = async (data: ComplaintData) => {
  return axiosInstance.post<ComplaintData>(`${backendUrl}/app-one-backend/complaints`, data);
};

export const searchComplaints = async (params: {
  status?: string;
  complainantId?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}) => {
  return axiosInstance.get<{ items: ComplaintData[]; totalCount: number }>(
    `${backendUrl}/app-one-backend/complaints`,
    { params }
  );
};

export const getComplaintById = async (id: number) => {
  return axiosInstance.get<ComplaintData>(`${backendUrl}/app-one-backend/complaints/${id}`);
};

export const updateComplaintStatus = async (id: number, data: ComplaintStatusUpdate) => {
  return axiosInstance.patch<ComplaintData>(`${backendUrl}/app-one-backend/complaints/${id}/status`, data);
};
