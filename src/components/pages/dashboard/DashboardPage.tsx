import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActionArea,
  Grid,
  CircularProgress,
  Chip,
} from "@mui/material";
import { getMyProfile } from "../register/registerApiService";
import type { ResidentData } from "../register/registerApiService";
import style from "./DashboardPage.module.css";

const DashboardPage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const [resident, setResident] = useState<ResidentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    if (inProgress === "none" && accounts.length <= 0) {
      navigate("/");
    }
  }, [accounts, inProgress]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        setResident(response.data);
        setHasProfile(true);
      } catch {
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    if (accounts.length > 0) {
      fetchProfile();
    }
  }, [accounts]);

  useEffect(() => {
    if (!loading && !hasProfile) {
      navigate("/register");
    }
  }, [loading, hasProfile]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className={style.container}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            BarangayConnect
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            {accounts[0]?.name}
          </Typography>
          <Button color="inherit" onClick={() => instance.logoutPopup()}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        {resident && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom>
              Welcome, {resident.firstName} {resident.lastName}
            </Typography>
            <Chip
              label={resident.isVerified ? "Verified" : "Unverified"}
              color={resident.isVerified ? "success" : "default"}
              size="small"
            />
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea onClick={() => navigate("/clearance-requests")}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Clearance Requests
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Request barangay clearance, track status, and print approved clearances
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea onClick={() => navigate("/complaints")}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Complaints
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    File complaints, view blotter records, and track case status
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <Card>
              <CardActionArea onClick={() => navigate("/announcements")}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Announcements
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View barangay announcements, health drives, and emergency alerts
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default DashboardPage;
