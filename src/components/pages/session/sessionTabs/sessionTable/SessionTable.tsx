import {
  DataGrid,
  type GridFilterModel,
  type GridPaginationModel,
  type GridRowsProp,
  type GridSortModel,
} from "@mui/x-data-grid";
import * as React from "react";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../../../../redux-toolkit/store";
import { sessionTableColumnsDefinition } from "./columnsDefinition";
import { searchSessions } from "./sessionApiService";

const SessionTable: React.FC = () => {
  const [searchedDataRows, setSearchedDataRows] = useState<GridRowsProp>([]);

  const [searchedTotalRowsCount, setSearchedTotalRowsCount] = useState(5);

  const isTriggerSessionSearching = useSelector(
    (state: RootState) => state.session.isTriggerSessionSearching
  );

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: "startTime", sort: "desc" },
  ]);

  const [filterModel, setFilterModel] = useState<GridFilterModel>();

  const startSearching = async () => {
    try {
      setIsLoading(true);
      const response = await searchSessions(
        paginationModel,
        sortModel,
        filterModel
      );

      setSearchedDataRows(response.data.items);
      setSearchedTotalRowsCount(response.data.totalCount);
    } catch (error: unknown) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startSearching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel, sortModel, filterModel]);

  useEffect(() => {
    if (isTriggerSessionSearching) startSearching();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTriggerSessionSearching]);

  return (
    <DataGrid
      slotProps={{ toolbar: { showQuickFilter: false } }}
      showToolbar={true}
      rows={searchedDataRows}
      columns={sessionTableColumnsDefinition}
      rowCount={searchedTotalRowsCount}
      loading={isLoading}
      paginationMode="server"
      pageSizeOptions={[5, 10, 15]}
      onPaginationModelChange={setPaginationModel}
      paginationModel={paginationModel}
      sortingMode="server"
      sortingOrder={["asc", "desc"]}
      onSortModelChange={setSortModel}
      sortModel={sortModel}
      filterMode="server"
      filterDebounceMs={2000}
      onFilterModelChange={setFilterModel}
      filterModel={filterModel}
    />
  );
};

export default SessionTable;
