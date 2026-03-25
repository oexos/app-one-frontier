import { useState } from "react";
import { useNavigate } from "react-router";
import { useMsal } from "@azure/msal-react";
import {
  Card, CardContent, Typography, CardActionArea, Button, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import style from "./MorePage.module.css";

const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    try {
      await instance.logoutPopup();
      navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Typography variant="h6" fontWeight={600}>More</Typography>
      </div>
      <div className={style.cards}>
        <Tooltip title="Bulk update selling or cost prices for multiple products at once" arrow>
          <Card>
            <CardActionArea onClick={() => navigate("/more/quick-price-adjust")}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <TuneIcon color="primary" />
                <Typography variant="body1" fontWeight={500}>Quick Price Adjust</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Tooltip>
        <Tooltip title="View your account info and update store name" arrow>
          <Card>
            <CardActionArea onClick={() => navigate("/more/account-settings")}>
              <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <SettingsIcon color="primary" />
                <Typography variant="body1" fontWeight={500}>Account Settings</Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </Tooltip>

        <Tooltip title="Sign out of your account" arrow>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => setLogoutConfirm(true)}
            sx={{ mt: 2, mx: 2 }}
          >
            Logout
          </Button>
        </Tooltip>
      </div>

      <Dialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)}>
        <DialogTitle>Logout?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to logout?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogoutConfirm(false)}>Cancel</Button>
          <Button color="error" onClick={handleLogout}>Logout</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default MorePage;
