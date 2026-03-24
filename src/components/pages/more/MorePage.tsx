import { useNavigate } from "react-router";
import { useMsal } from "@azure/msal-react";
import { Card, CardContent, Typography, CardActionArea, Button } from "@mui/material";
import TuneIcon from "@mui/icons-material/Tune";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import style from "./MorePage.module.css";

const MorePage: React.FC = () => {
  const navigate = useNavigate();
  const { instance } = useMsal();

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
        <Card>
          <CardActionArea onClick={() => navigate("/more/quick-price-adjust")}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <TuneIcon color="primary" />
              <Typography variant="body1" fontWeight={500}>Quick Price Adjust</Typography>
            </CardContent>
          </CardActionArea>
        </Card>
        <Card>
          <CardActionArea onClick={() => navigate("/more/account-settings")}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <SettingsIcon color="primary" />
              <Typography variant="body1" fontWeight={500}>Account Settings</Typography>
            </CardContent>
          </CardActionArea>
        </Card>

        <Button
          variant="outlined"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={handleLogout}
          sx={{ mt: 2, mx: 2 }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
};

export default MorePage;
