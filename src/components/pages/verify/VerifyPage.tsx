import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Divider,
  Alert,
} from "@mui/material";
import dayjs from "dayjs";
import { verifyClearance } from "./verifyApiService";
import type { ClearanceVerificationResult } from "./verifyApiService";
import style from "./VerifyPage.module.css";

const VerifyPage: React.FC = () => {
  const { clearanceNumber } = useParams<{ clearanceNumber: string }>();
  const [result, setResult] = useState<ClearanceVerificationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const verify = async () => {
      try {
        const response = await verifyClearance(clearanceNumber!);
        setResult(response.data);
      } catch {
        setError("Clearance not found or invalid clearance number.");
      } finally {
        setLoading(false);
      }
    };
    if (clearanceNumber) {
      verify();
    }
  }, [clearanceNumber]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={style.container}>
      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Barangay Clearance Verification
          </Typography>
          <Divider sx={{ my: 2 }} />

          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          {result && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
                {result.isExpired ? (
                  <Chip label="EXPIRED" color="error" size="medium" sx={{ fontSize: "1.1rem", px: 2 }} />
                ) : (
                  <Chip label="VALID" color="success" size="medium" sx={{ fontSize: "1.1rem", px: 2 }} />
                )}
              </Box>

              <Typography><strong>Clearance Number:</strong> {result.clearanceNumber}</Typography>
              <Typography><strong>Resident Name:</strong> {result.residentName}</Typography>
              <Typography><strong>Purpose:</strong> {result.purpose}</Typography>
              <Typography><strong>Status:</strong> {result.status}</Typography>
              <Typography>
                <strong>Date Issued:</strong>{" "}
                {result.issuedAt ? dayjs(result.issuedAt).format("MMMM D, YYYY") : "N/A"}
              </Typography>
              <Typography>
                <strong>Expiry Date:</strong>{" "}
                {result.expiryDate ? dayjs(result.expiryDate).format("MMMM D, YYYY") : "N/A"}
              </Typography>

              {result.isExpired && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  This clearance has expired. The resident must request a new clearance.
                </Alert>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
};

export default VerifyPage;
