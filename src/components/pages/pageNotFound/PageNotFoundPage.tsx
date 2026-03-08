import Button from "@mui/material/Button";
import { NavLink } from "react-router";
import style from "./PageNotFoundPage.module.css";

const PageNotFoundPage: React.FC = () => {
  return (
    <>
      <div className={style.grid}>
        <div>Page Not Found !</div>
        <NavLink to="/" end>
          <Button>Go Home</Button>
        </NavLink>
      </div>
    </>
  );
};

export default PageNotFoundPage;
