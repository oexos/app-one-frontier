import { useMsal } from "@azure/msal-react";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router";
import style from "./HomePage.module.css";

const HomePage: React.FC = () => {
  //https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md#sign-a-user-in-using-the-login-apis-provided-by-azuremsal-browser
  //https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
  //https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-single-page-app-react-prepare-app?tabs=external-tenant
  const { instance, accounts, inProgress } = useMsal();

  //https://reactrouter.com/start/declarative/installation
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      await instance.loginPopup();
      //https://reactrouter.com/start/declarative/installation
      navigate("/session");
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
        <Button onClick={() => instance.logoutPopup()}>Logout</Button>
      </>
    );
  } else if (inProgress === "login") {
    authenticationContent = <span>Login is currently in progress!</span>;
  } else if (inProgress === "logout") {
    authenticationContent = <span>Logout is currently in progress!</span>;
  } else {
    authenticationContent = (
      <>
        <div>Login to continue!</div>
        <br />
        <Button onClick={handleLogin}>Login</Button>
      </>
    );
  }

  return (
    <div className={style.grid}>
      <h2>APP ONE</h2>
      {authenticationContent}
    </div>
  );
};

export default HomePage;
