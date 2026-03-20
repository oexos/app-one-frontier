import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Paper,
  Chip,
  CircularProgress,
  TextField,
  MenuItem,
  Alert,
  Divider,
} from "@mui/material";
import dayjs from "dayjs";
import { getClearanceRequestById, updateClearanceRequestStatus } from "../clearanceRequestApiService";
import type { ClearanceRequestData } from "../clearanceRequestApiService";
import style from "./ClearanceRequestDetailPage.module.css";

const statusColorMap: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  PENDING: "warning",
  PROCESSING: "info",
  APPROVED: "success",
  REJECTED: "error",
  COMPLETED: "default",
};

const ClearanceRequestDetailPage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<ClearanceRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (inProgress === "none" && accounts.length <= 0) {
      navigate("/");
    }
  }, [accounts, inProgress]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getClearanceRequestById(Number(id));
      setRequest(response.data);
    } catch {
      console.error("Failed to fetch clearance request");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accounts.length > 0 && id) {
      fetchData();
    }
  }, [accounts, id]);

  const handleUpdateStatus = async () => {
    setUpdating(true);
    setError("");
    try {
      await updateClearanceRequestStatus(Number(id), {
        status: newStatus,
        remarks: remarks || undefined,
      });
      await fetchData();
      setNewStatus("");
      setRemarks("");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { errorDetail?: string } } };
      setError(e.response?.data?.errorDetail || "Failed to update status.");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!request) {
    return <Typography>Clearance request not found.</Typography>;
  }

  const getStatusOptions = (): string[] => {
    switch (request.status) {
      case "PENDING": return ["PROCESSING", "REJECTED"];
      case "PROCESSING": return ["APPROVED", "REJECTED"];
      case "APPROVED": return ["COMPLETED"];
      default: return [];
    }
  };

  const statusOptions = getStatusOptions();
  const canPrint = request.status === "APPROVED" || request.status === "COMPLETED";

  return (
    <Box className={style.container}>
      <AppBar position="static" className={style.noPrint}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            BarangayConnect - Clearance Request Detail
          </Typography>
          <Button color="inherit" onClick={() => navigate("/clearance-requests")}>
            Back to List
          </Button>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => instance.logoutPopup()}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 800, mx: "auto" }}>
        <Paper sx={{ p: 3 }} className={style.printArea}>
          <Box className={style.printHeader}>
            <Typography variant="h4" align="center" gutterBottom>
              Republic of the Philippines
            </Typography>
            <Typography variant="h5" align="center" gutterBottom>
              Barangay Clearance
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="body1"><strong>Clearance #:</strong> {request.clearanceNumber || "Not yet assigned"}</Typography>
              <Chip label={request.status} color={statusColorMap[request.status || ""] || "default"} />
            </Box>

            <Typography variant="body1">
              <strong>Resident:</strong>{" "}
              {request.resident
                ? `${request.resident.firstName} ${request.resident.middleName || ""} ${request.resident.lastName}`.trim()
                : "N/A"}
            </Typography>

            {request.resident && (
              <Typography variant="body1">
                <strong>Address:</strong> {request.resident.address}
              </Typography>
            )}

            <Typography variant="body1"><strong>Purpose:</strong> {request.purpose}</Typography>

            <Typography variant="body1">
              <strong>Date Filed:</strong> {request.createdAt ? dayjs(request.createdAt).format("MMMM D, YYYY h:mm A") : "N/A"}
            </Typography>

            {request.processedAt && (
              <Typography variant="body1">
                <strong>Date Processed:</strong> {dayjs(request.processedAt).format("MMMM D, YYYY h:mm A")}
              </Typography>
            )}

            {request.processedBy && (
              <Typography variant="body1"><strong>Processed By:</strong> {request.processedBy}</Typography>
            )}

            <Typography variant="body1">
              <strong>Payment Ref #:</strong> {request.paymentReferenceNumber || "N/A"}
            </Typography>
            <Typography variant="body1">
              <strong>Amount:</strong> PHP {request.paymentAmount || "N/A"}
            </Typography>

            {request.remarks && (
              <Typography variant="body1"><strong>Remarks:</strong> {request.remarks}</Typography>
            )}

            {canPrint && request.qrCodeData && (
              <Box sx={{ mt: 2, p: 2, bgcolor: "#f0f0f0", borderRadius: 1 }}>
                <Typography variant="body2">
                  <strong>Verification URL:</strong>{" "}
                  <a href={request.qrCodeData} target="_blank" rel="noopener noreferrer">
                    {window.location.origin}{request.qrCodeData}
                  </a>
                </Typography>
              </Box>
            )}

            {canPrint && (
              <Box className={style.printCertification} sx={{ mt: 3, p: 2, border: "1px solid #ccc", borderRadius: 1 }}>
                <Typography variant="body1" align="center">
                  This is to certify that the above-named person is a bonafide resident of this barangay
                  and has no derogatory record on file as of the date of issuance.
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>

        <Box className={style.noPrint} sx={{ mt: 3, display: "flex", gap: 2 }}>
          {canPrint && (
            <Button variant="contained" color="primary" onClick={handlePrint}>
              Print Clearance
            </Button>
          )}
        </Box>

        {statusOptions.length > 0 && (
          <Paper sx={{ p: 3, mt: 3 }} className={style.noPrint}>
            <Typography variant="h6" gutterBottom>
              Update Status
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="New Status"
                variant="outlined"
                fullWidth
                select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              >
                {statusOptions.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Remarks (optional)"
                variant="outlined"
                fullWidth
                multiline
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />

              <Button
                variant="contained"
                onClick={handleUpdateStatus}
                disabled={!newStatus || updating}
              >
                {updating ? <CircularProgress size={24} /> : "Update Status"}
              </Button>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default ClearanceRequestDetailPage;
