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
import { triggerClearanceRefresh, setShowCreateForm } from "./clearanceRequestSlice";
import { searchClearanceRequests, createClearanceRequest } from "./clearanceRequestApiService";
import type { ClearanceRequestData } from "./clearanceRequestApiService";
import { getMyProfile } from "../register/registerApiService";
import type { ResidentData } from "../register/registerApiService";
import style from "./ClearanceRequestPage.module.css";

interface CreateInputs {
  purpose: string;
  paymentReferenceNumber: string;
  paymentAmount: string;
}

const statusColorMap: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  PENDING: "warning",
  PROCESSING: "info",
  APPROVED: "success",
  REJECTED: "error",
  COMPLETED: "default",
};

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 70 },
  {
    field: "residentName",
    headerName: "Resident",
    width: 200,
    sortable: false,
    valueGetter: (_value: unknown, row: ClearanceRequestData) =>
      row.resident ? `${row.resident.firstName} ${row.resident.lastName}` : "",
  },
  { field: "purpose", headerName: "Purpose", width: 150 },
  {
    field: "status",
    headerName: "Status",
    width: 130,
    renderCell: (params) => (
      <Chip label={params.value} color={statusColorMap[params.value as string] || "default"} size="small" />
    ),
  },
  { field: "clearanceNumber", headerName: "Clearance #", width: 150 },
  {
    field: "createdAt",
    headerName: "Date Filed",
    width: 180,
    valueFormatter: (value: string) => (value ? dayjs(value).format("MMM D, YYYY h:mm A") : ""),
  },
];

const ClearanceRequestPage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { refreshTrigger, showCreateForm } = useSelector((state: RootState) => state.clearanceRequest);

  const [rows, setRows] = useState<ClearanceRequestData[]>([]);
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
    if (accounts.length > 0) {
      fetchProfile();
    }
  }, [accounts]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const sortBy = sortModel[0]?.field || "id";
        const sortDirection = (sortModel[0]?.sort || "desc").toUpperCase();
        const response = await searchClearanceRequests({
          page: paginationModel.page,
          size: paginationModel.pageSize,
          sortBy,
          sortDirection,
        });
        setRows(response.data.items);
        setTotalCount(response.data.totalCount);
      } catch (error) {
        console.error("Failed to fetch clearance requests:", error);
      } finally {
        setLoading(false);
      }
    };
    if (accounts.length > 0) {
      fetchData();
    }
  }, [paginationModel, sortModel, refreshTrigger, accounts]);

  const { control, handleSubmit, formState, trigger, reset } = useForm<CreateInputs>({
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: {
      purpose: "",
      paymentReferenceNumber: "",
      paymentAmount: "",
    },
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
      await createClearanceRequest({
        residentId: myProfile!.id!,
        purpose: data.purpose,
        paymentReferenceNumber: data.paymentReferenceNumber,
        paymentAmount: parseFloat(data.paymentAmount) || 0,
      });
      dispatch(setShowCreateForm(false));
      dispatch(triggerClearanceRefresh());
      reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errorDetail?: string } } };
      setSubmitError(err.response?.data?.errorDetail || "Failed to submit clearance request.");
    }
  };

  const onError: SubmitErrorHandler<CreateInputs> = (errors) => {
    console.error("Validation errors:", errors);
  };

  return (
    <Box className={style.container}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            BarangayConnect - Clearance Requests
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => instance.logoutPopup()}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5">Clearance Requests</Typography>
          <Button variant="contained" onClick={() => dispatch(setShowCreateForm(true))}>
            New Clearance Request
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
            onRowClick={(params) => navigate(`/clearance-requests/${params.id}`)}
            sx={{ cursor: "pointer", minHeight: 400 }}
          />
        </Paper>
      </Box>

      <Dialog
        open={showCreateForm}
        onClose={() => dispatch(setShowCreateForm(false))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>New Clearance Request</DialogTitle>
        <DialogContent>
          {submitError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {submitError}
            </Alert>
          )}

          <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
            Pay PHP 100 to GCash: 0917-XXX-XXXX, then enter the reference number below.
          </Alert>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Controller
              name="purpose"
              control={control}
              rules={{ required: "Purpose is required" }}
              render={({ field }) => (
                <TextField label="Purpose" variant="outlined" fullWidth select required
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field}>
                  <MenuItem value="Employment">Employment</MenuItem>
                  <MenuItem value="Business Permit">Business Permit</MenuItem>
                  <MenuItem value="Travel">Travel</MenuItem>
                  <MenuItem value="School Requirement">School Requirement</MenuItem>
                  <MenuItem value="Bank Requirement">Bank Requirement</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="paymentReferenceNumber"
              control={control}
              rules={{ required: "GCash reference number is required" }}
              render={({ field }) => (
                <TextField label="GCash Reference Number" variant="outlined" fullWidth required
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field} />
              )}
            />

            <Controller
              name="paymentAmount"
              control={control}
              rules={{ required: "Payment amount is required" }}
              render={({ field }) => (
                <TextField label="Payment Amount (PHP)" variant="outlined" fullWidth required type="number"
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field} />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { dispatch(setShowCreateForm(false)); reset(); setSubmitError(""); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSubmit(onSubmit, onError)()}
            disabled={oneOfTheFieldsHasErrors || !oneOfTheFieldsIsDirty || formState.isSubmitting}
          >
            {formState.isSubmitting ? <CircularProgress size={24} /> : "Submit Request"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClearanceRequestPage;
