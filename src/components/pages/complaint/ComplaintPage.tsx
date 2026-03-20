import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridPaginationModel, GridSortModel } from "@mui/x-data-grid";
import dayjs from "dayjs";
import type { RootState, AppDispatch } from "../../../redux-toolkit/store";
import { triggerComplaintRefresh, setShowComplaintForm } from "./complaintSlice";
import { searchComplaints, createComplaint } from "./complaintApiService";
import type { ComplaintData } from "./complaintApiService";
import { getMyProfile } from "../register/registerApiService";
import type { ResidentData } from "../register/registerApiService";
import style from "./ComplaintPage.module.css";

interface CreateInputs {
  respondentName: string;
  description: string;
  category: string;
}

const statusColorMap: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  FILED: "warning",
  UNDER_INVESTIGATION: "info",
  MEDIATION_SCHEDULED: "info",
  RESOLVED: "success",
  ESCALATED: "error",
};

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "complainantName",
    headerName: "Complainant",
    width: 180,
    sortable: false,
    valueGetter: (_value: unknown, row: ComplaintData) =>
      row.complainant ? `${row.complainant.firstName} ${row.complainant.lastName}` : "",
  },
  { field: "respondentName", headerName: "Respondent", width: 150 },
  { field: "category", headerName: "Category", width: 150 },
  {
    field: "status",
    headerName: "Status",
    width: 180,
    renderCell: (params) => (
      <Chip label={params.value} color={statusColorMap[params.value as string] || "default"} size="small" />
    ),
  },
  {
    field: "createdAt",
    headerName: "Date Filed",
    width: 180,
    valueFormatter: (value: string) => (value ? dayjs(value).format("MMM D, YYYY h:mm A") : ""),
  },
];

const ComplaintPage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { refreshTrigger, showCreateForm } = useSelector((state: RootState) => state.complaint);

  const [rows, setRows] = useState<ComplaintData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: "id", sort: "desc" }]);
  const [myProfile, setMyProfile] = useState<ResidentData | null>(null);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (inProgress === "none" && accounts.length <= 0) {
      navigate("/");
    }
  }, [accounts, inProgress]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        setMyProfile(response.data);
      } catch {
        console.error("Failed to fetch profile");
      }
    };
    if (accounts.length > 0) fetchProfile();
  }, [accounts]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sortBy = sortModel[0]?.field || "id";
        const sortDirection = (sortModel[0]?.sort || "desc").toUpperCase();
        const response = await searchComplaints({
          page: paginationModel.page,
          size: paginationModel.pageSize,
          sortBy,
          sortDirection,
        });
        setRows(response.data.items);
        setTotalCount(response.data.totalCount);
      } catch (error) {
        console.error("Failed to fetch complaints:", error);
      } finally {
        setLoading(false);
      }
    };
    if (accounts.length > 0) fetchData();
  }, [paginationModel, sortModel, refreshTrigger, accounts]);

  const { control, handleSubmit, formState, trigger, reset } = useForm<CreateInputs>({
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: { respondentName: "", description: "", category: "" },
  });

  useEffect(() => {
    if (showCreateForm) {
      const timer = setTimeout(() => trigger(), 0);
      return () => clearTimeout(timer);
    }
  }, [showCreateForm, trigger]);

  const oneOfTheFieldsHasErrors = Object.keys(formState.errors).length > 0;
  const oneOfTheFieldsIsDirty = Object.keys(formState.dirtyFields).length > 0;

  const onSubmit: SubmitHandler<CreateInputs> = async (data) => {
    setSubmitError("");
    try {
      await createComplaint({
        complainantId: myProfile!.id!,
        respondentName: data.respondentName,
        description: data.description,
        category: data.category,
      });
      dispatch(setShowComplaintForm(false));
      dispatch(triggerComplaintRefresh());
      reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errorDetail?: string } } };
      setSubmitError(err.response?.data?.errorDetail || "Failed to file complaint.");
    }
  };

  const onError: SubmitErrorHandler<CreateInputs> = (errors) => console.error(errors);

  return (
    <Box className={style.container}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            BarangayConnect - Complaints
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          <Button color="inherit" onClick={() => instance.logoutPopup()}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5">Complaints & Blotter</Typography>
          <Button variant="contained" onClick={() => dispatch(setShowComplaintForm(true))}>
            File Complaint
          </Button>
        </Box>

        <Paper sx={{ width: "100%" }}>
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={totalCount}
            loading={loading}
            pageSizeOptions={[5, 10, 25]}
            paginationModel={paginationModel}
            paginationMode="server"
            sortingMode="server"
            onPaginationModelChange={setPaginationModel}
            onSortModelChange={setSortModel}
            sx={{ minHeight: 400 }}
          />
        </Paper>
      </Box>

      <Dialog
        open={showCreateForm}
        onClose={() => dispatch(setShowComplaintForm(false))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>File a Complaint</DialogTitle>
        <DialogContent>
          {submitError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{submitError}</Alert>}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Controller
              name="respondentName"
              control={control}
              render={({ field }) => (
                <TextField label="Respondent Name" variant="outlined" fullWidth {...field} />
              )}
            />

            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <TextField label="Category" variant="outlined" fullWidth select required
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field}>
                  <MenuItem value="NOISE">Noise</MenuItem>
                  <MenuItem value="PROPERTY">Property</MenuItem>
                  <MenuItem value="DOMESTIC">Domestic</MenuItem>
                  <MenuItem value="PUBLIC_DISTURBANCE">Public Disturbance</MenuItem>
                  <MenuItem value="OTHER">Other</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="description"
              control={control}
              rules={{ required: "Description is required" }}
              render={({ field }) => (
                <TextField label="Description" variant="outlined" fullWidth multiline rows={4} required
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field} />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { dispatch(setShowComplaintForm(false)); reset(); setSubmitError(""); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSubmit(onSubmit, onError)()}
            disabled={oneOfTheFieldsHasErrors || !oneOfTheFieldsIsDirty || formState.isSubmitting}
          >
            {formState.isSubmitting ? <CircularProgress size={24} /> : "File Complaint"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ComplaintPage;
