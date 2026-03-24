import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useMsal } from "@azure/msal-react";
import { Snackbar, Alert } from "@mui/material";
import BottomNav from "./BottomNav";
import { getMyStore } from "../pages/storeSetup/storeApiService";
import style from "./AuthenticatedLayout.module.css";

interface StoreData {
  id: number;
  storeName: string;
  ownerEmail: string;
}

const AuthenticatedLayout: React.FC = () => {
  const { accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [store, setStore] = useState<StoreData | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    if (inProgress === "none" && accounts.length <= 0) {
      navigate("/");
    }
  }, [accounts, inProgress, navigate]);

  useEffect(() => {
    if (inProgress === "none" && accounts.length > 0) {
      getMyStore()
        .then((res) => {
          setStore(res.data);
          setStoreLoaded(true);
        })
        .catch((err) => {
          if (err.response?.status === 404) {
            navigate("/store-setup");
          } else {
            console.error("Failed to load store", err);
            setStoreLoaded(true);
          }
        });
    }
  }, [accounts, inProgress, navigate]);

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  if (!storeLoaded) {
    return <div className={style.loading}>Loading...</div>;
  }

  return (
    <div className={style.container}>
      <div className={style.content}>
        <Outlet context={{ store, showSnackbar }} />
      </div>
      <BottomNav />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AuthenticatedLayout;

export interface LayoutContext {
  store: StoreData | null;
  showSnackbar: (message: string, severity?: "success" | "error") => void;
}
