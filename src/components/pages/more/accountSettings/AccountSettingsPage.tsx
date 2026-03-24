import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { useMsal } from "@azure/msal-react";
import { useForm, Controller } from "react-hook-form";
import { Typography, Card, CardContent, TextField, Button, IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { getMyStore, updateStore } from "../../storeSetup/storeApiService";
import { LayoutContext } from "../../../layout/AuthenticatedLayout";
import style from "./AccountSettingsPage.module.css";

interface Inputs {
  storeName: string;
}

const isUPN = (value: string): boolean => /^[0-9a-f-]+@.*\.onmicrosoft\.com$/i.test(value);

const extractEmail = (account: { username?: string; idTokenClaims?: Record<string, unknown> }): string => {
  const claims = account.idTokenClaims || {};
  // Check standard email claims
  if (typeof claims.email === "string" && !isUPN(claims.email)) return claims.email;
  if (Array.isArray(claims.emails) && claims.emails.length > 0 && !isUPN(claims.emails[0])) return claims.emails[0];
  // Check social identity provider claims (CIAM with Google social login)
  if (typeof claims.signInNames_emailAddress === "string") return claims.signInNames_emailAddress;
  if (typeof claims.preferred_username === "string" && !isUPN(claims.preferred_username)) return claims.preferred_username;
  // Fallback to username if it looks like a real email
  const username = account.username || "";
  if (username.includes("@") && !isUPN(username)) return username;
  return "";
};

const decodeIdTokenEmail = (): string => {
  try {
    const keys = Object.keys(sessionStorage);
    for (const key of keys) {
      if (key.includes("idtoken")) {
        const val = JSON.parse(sessionStorage.getItem(key) || "{}");
        if (val.secret) {
          const payload = JSON.parse(atob(val.secret.split(".")[1]));
          if (typeof payload.email === "string" && !isUPN(payload.email)) return payload.email;
          if (Array.isArray(payload.emails) && payload.emails.length > 0 && !isUPN(payload.emails[0])) return payload.emails[0];
        }
      }
    }
  } catch (err) {
    console.error("Failed to decode ID token", err);
  }
  return "";
};

const AccountSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");

  const { control, handleSubmit, formState, reset, trigger } = useForm<Inputs>({
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: { storeName: "" },
  });

  useEffect(() => {
    if (accounts.length > 0) {
      setDisplayName(accounts[0].name || "");
    }
    getMyStore().then((res) => {
      reset({ storeName: res.data.storeName });
      // Set ownerEmail first as fallback (skip UPNs), then override with MSAL email if available
      if (res.data.ownerEmail && !isUPN(res.data.ownerEmail)) {
        setEmail(res.data.ownerEmail);
      }
      if (accounts.length > 0) {
        const msalEmail = extractEmail(accounts[0]);
        if (msalEmail) {
          setEmail(msalEmail);
        } else {
          // MSAL account object may not have idTokenClaims populated — decode from cached ID token
          const tokenEmail = decodeIdTokenEmail();
          if (tokenEmail) setEmail(tokenEmail);
        }
      }
    }).catch(console.error);
  }, [accounts, reset]);

  useEffect(() => {
    const timeout = setTimeout(() => { trigger(); }, 100);
    return () => clearTimeout(timeout);
  }, [trigger]);

  const oneOfTheFieldsHasErrors = Object.keys(formState.errors).length > 0;
  const oneOfTheFieldIsValidating = Object.keys(formState.validatingFields).length > 0;
  const oneOfTheFieldsIsDirty = Object.keys(formState.dirtyFields).length > 0;

  const onSubmit = async (data: Inputs) => {
    try {
      await updateStore(data.storeName);
      showSnackbar("Store name updated");
      reset({ storeName: data.storeName });
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to update store name", "error");
    }
  };

  const onError = (error: unknown) => console.error(error);

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Tooltip title="Back to more options" arrow>
          <IconButton onClick={() => navigate("/more")}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" fontWeight={600}>Account Settings</Typography>
      </div>

      <Card sx={{ mx: 2, mt: 1 }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {displayName && (
            <TextField label="Name" value={displayName} disabled fullWidth />
          )}
          <TextField
            label="Email"
            value={email || "Signed in via Google"}
            disabled
            fullWidth
            helperText={!email ? "Email not available in token claims" : ""}
          />

          <Controller
            name="storeName"
            control={control}
            rules={{ required: "Store name is required" }}
            render={({ field }) => (
              <TextField
                label="Store Name"
                fullWidth
                required
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                error={Boolean(formState.dirtyFields.storeName && formState.errors.storeName)}
                helperText={formState.dirtyFields.storeName && formState.errors.storeName?.message}
                {...field}
              />
            )}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={() => handleSubmit(onSubmit, onError)()}
            disabled={oneOfTheFieldsHasErrors || oneOfTheFieldIsValidating || !oneOfTheFieldsIsDirty || formState.isSubmitting || formState.isLoading}
          >
            {formState.isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettingsPage;
