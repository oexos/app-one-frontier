import { axiosInstance } from "../../../api-client/axiosHttpClient";

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export interface AnnouncementData {
  id?: number;
  title: string;
  content: string;
  category: string;
  isActive?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const createAnnouncement = async (data: AnnouncementData) => {
  return axiosInstance.post<AnnouncementData>(`${backendUrl}/app-one-backend/announcements`, data);
};

export const searchAnnouncements = async (params: {
  category?: string;
  isActive?: boolean;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}) => {
  return axiosInstance.get<{ items: AnnouncementData[]; totalCount: number }>(
    `${backendUrl}/app-one-backend/announcements`,
    { params }
  );
};

export const getAnnouncementById = async (id: number) => {
  return axiosInstance.get<AnnouncementData>(`${backendUrl}/app-one-backend/announcements/${id}`);
};

export const updateAnnouncement = async (id: number, data: Partial<AnnouncementData>) => {
  return axiosInstance.patch<AnnouncementData>(`${backendUrl}/app-one-backend/announcements/${id}`, data);
};

export const deactivateAnnouncement = async (id: number) => {
  return axiosInstance.patch(`${backendUrl}/app-one-backend/announcements/${id}/deactivate`);
};
