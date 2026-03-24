import { useMsal } from "@azure/msal-react";
import { useEffect } from "react";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import style from "./HomePage.module.css";

const HomePage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();

  useEffect(() => {
    if (inProgress === "none" && accounts.length > 0) {
      navigate("/sell");
    }
  }, [accounts, inProgress, navigate]);

  const handleLogin = async () => {
    try {
      await instance.loginPopup();
      navigate("/sell");
    } catch (error: unknown) {
      console.log(error);
    }
  };

  let authenticationContent;

  if (accounts.length > 0) {
    authenticationContent = (
      <>
        <div>Welcome {accounts[0].name?.toUpperCase()}</div>
        <br />
        <Button variant="outlined" onClick={() => instance.logoutPopup()}>Logout</Button>
      </>
    );
  } else if (inProgress === "login") {
    authenticationContent = <span>Login is currently in progress!</span>;
  } else if (inProgress === "logout") {
    authenticationContent = <span>Logout is currently in progress!</span>;
  } else {
    authenticationContent = (
      <div className={style.loginSection}>
        <div className={style.tagline}>Simple POS for Sari-Sari Stores</div>
        <Button variant="contained" size="large" onClick={handleLogin} sx={{ mt: 2, px: 4, py: 1.5, borderRadius: 3, fontSize: "1rem" }}>
          Login with Google
        </Button>
      </div>
    );
  }

  return (
    <div className={style.grid}>
      <h1 className={style.title}>TindahanPOS</h1>
      {authenticationContent}
    </div>
  );
};

export default HomePage;
