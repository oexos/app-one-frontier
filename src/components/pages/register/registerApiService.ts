import { axiosInstance } from "../../../api-client/axiosHttpClient";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface ResidentData {
  id?: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  contactNumber: string;
  email?: string;
  address: string;
  residenceSince: string;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const createResident = async (data: ResidentData) => {
  return axiosInstance.post<ResidentData>(`${backendUrl}/app-one-backend/residents`, data);
};

export const getMyProfile = async () => {
  return axiosInstance.get<ResidentData>(`${backendUrl}/app-one-backend/residents/me`);
};

export const getResidentById = async (id: number) => {
  return axiosInstance.get<ResidentData>(`${backendUrl}/app-one-backend/residents/${id}`);
};

export const searchResidents = async (params: {
  search?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}) => {
  return axiosInstance.get<{ items: ResidentData[]; totalCount: number }>(
    `${backendUrl}/app-one-backend/residents`,
    { params }
  );
};

export const updateResident = async (id: number, data: Partial<ResidentData>) => {
  return axiosInstance.patch<ResidentData>(`${backendUrl}/app-one-backend/residents/${id}`, data);
};
