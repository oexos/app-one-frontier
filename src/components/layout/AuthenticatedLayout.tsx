import { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router";
import { useMsal } from "@azure/msal-react";
import { Snackbar, Alert, Button, Typography } from "@mui/material";
import BottomNav from "./BottomNav";
import { getMyStore } from "../pages/storeSetup/storeApiService";
import style from "./AuthenticatedLayout.module.css";

interface StoreData {
  id: number;
  storeName: string;
  ownerEmail: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

const AuthenticatedLayout: React.FC = () => {
  const { accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const [storeLoaded, setStoreLoaded] = useState(false);
  const [storeError, setStoreError] = useState(false);
  const [store, setStore] = useState<StoreData | null>(null);
  const retryCountRef = useRef(0);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({
    open: false,
    message: "",
    severity: "success",
  });

  const loadStore = useCallback((isRetry = false) => {
    if (!isRetry) {
      retryCountRef.current = 0;
    }
    setStoreError(false);
    setStoreLoaded(false);
    getMyStore()
      .then((res) => {
        setStore(res.data);
        setStoreLoaded(true);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          navigate("/store-setup");
        } else if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current += 1;
          console.log(`Store load failed, retrying (${retryCountRef.current}/${MAX_RETRIES})...`);
          setTimeout(() => loadStore(true), RETRY_DELAY_MS);
        } else {
          console.error("Failed to load store after retries", err);
          setStoreError(true);
        }
      });
  }, [navigate]);

  useEffect(() => {
    if (inProgress === "none" && accounts.length <= 0) {
      navigate("/");
    }
  }, [accounts, inProgress, navigate]);

  useEffect(() => {
    if (inProgress === "none" && accounts.length > 0) {
      loadStore();
    }
  }, [accounts, inProgress, navigate, loadStore]);

  const showSnackbar = (message: string, severity: "success" | "error" = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  if (storeError) {
    return (
      <div className={style.loading}>
        <Typography variant="body1" sx={{ mb: 2 }}>Failed to load your store. Please try again.</Typography>
        <Button variant="contained" onClick={() => loadStore()}>
          Retry
        </Button>
      </div>
    );
  }

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
