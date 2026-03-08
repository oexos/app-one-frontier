import type {
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from "@mui/x-data-grid";
import { axiosInstance } from "../../../../../api-client/axiosHttpClient";

export type Session = {
  id?: number;
  startTime: string;
  endTime: string;
  title: string;
  priority: string;
  speaker: string;
};

export type SessionData = {
  items: Session[];
  totalCount: number;
};

const backendUrl = import.meta.env.VITE_APP_ONE_MICROSERVICE_URL;

export const searchSessions = async (
  paginationModel: GridPaginationModel,
  sortModel: GridSortModel,
  filterModel?: GridFilterModel
) => {
  const queryParams = {
    pageNumber: paginationModel.page,
    pageSize: paginationModel.pageSize,
    sortBy: sortModel[0].field,
    sortDirection: sortModel[0].sort,
    speakerFilter: filterModel?.items.filter(
      (item) => item.field === "speaker"
    )[0]?.value,
    priorityFilter: filterModel?.items.filter(
      (item) => item.field === "priority"
    )[0]?.value,
    startDateTimeFilter: filterModel?.items.filter(
      (item) => item.field === "startTime"
    )[0]?.value,
    endDateTimeFilter: filterModel?.items.filter(
      (item) => item.field === "endTime"
    )[0]?.value,
  };

  const response = await axiosInstance.get<SessionData>(
    `${backendUrl}/app-one-backend/sessions`,
    { params: queryParams, timeout: 600000 }
  );

  return response;
};

export const createSession = async (sessionData: Session) => {
  const response = await axiosInstance.post<Session>(
    `${backendUrl}/app-one-backend/sessions`,
    sessionData,
    { timeout: 600000 }
  );
  return response;
};
