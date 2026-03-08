import { useMsal } from "@azure/msal-react";
import Button from "@mui/material/Button";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import type { RootState } from "../../../redux-toolkit/store";
import style from "./SessionPage.module.css";
import { setIsShowSessionForm } from "./sessionSlice";
import SessionForm from "./sessionTabs/sessionForm/SessionForm";
import SessionTabs from "./sessionTabs/SessionTabs";

const SessionPage: React.FC = () => {
  const dispatch = useDispatch();
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const isShowSessionForm = useSelector(
    (state: RootState) => state.session.isShowSessionForm
  );

  useEffect(() => {
    if (inProgress === "none") {
      if (accounts.length <= 0) {
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    }
  }, [accounts, accounts.length, inProgress, navigate]);

  if (inProgress !== "none") {
    return <>Loading...</>;
  } else if (accounts.length > 0) {
    return (
      <div className={style.grid}>
        <div className={style.firstSubGrid}>
          <div className={style.pageName}>Session Page</div>
          <Button
            className={style.logout}
            onClick={() => instance.logoutPopup()}
          >
            Logout
          </Button>
        </div>
        <div className={style.newSession}>
          <Button
            onClick={() => dispatch(setIsShowSessionForm(true))}
            variant="contained"
          >
            New Session
          </Button>
          {isShowSessionForm && <SessionForm></SessionForm>}
        </div>
        <div className={style.sessionTab}>
          <SessionTabs></SessionTabs>
        </div>
      </div>
    );
  } else {
    return "Redirecting to home page...";
  }
};

export default SessionPage;
