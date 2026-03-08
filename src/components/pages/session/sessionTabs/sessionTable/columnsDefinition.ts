import { getGridStringOperators, type GridColDef } from "@mui/x-data-grid";

export const sessionTableColumnsDefinition: GridColDef[] = [
  {
    field: "startTime",
    headerName: "Start Time",
    type: "string",
    filterOperators: getGridStringOperators().filter(
      (operator) => operator.value === "contains"
    ),
    sortable: true,
    filterable: true,
    minWidth: 200,
  },
  {
    field: "endTime",
    headerName: "End Time",
    type: "string",
    filterOperators: getGridStringOperators().filter(
      (operator) => operator.value === "contains"
    ),
    sortable: true,
    filterable: true,
    minWidth: 200,
  },
  {
    field: "title",
    headerName: "Title",
    minWidth: 300,
    type: "string",
    sortable: false,
    filterable: false,
  },
  {
    field: "priority",
    headerName: "Priority",
    minWidth: 150,
    type: "string",
    filterOperators: getGridStringOperators().filter(
      (operator) => operator.value === "equals"
    ),
    sortable: true,
    filterable: true,
  },
  {
    field: "speaker",
    headerName: "Speaker",
    type: "string",
    filterOperators: getGridStringOperators().filter(
      (operator) => operator.value === "contains"
    ),
    filterable: true,
    minWidth: 250,
    sortable: false,
  },
];
