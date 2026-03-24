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

const extractEmail = (account: { username?: string; idTokenClaims?: Record<string, unknown> }): string => {
  const claims = account.idTokenClaims || {};
  if (typeof claims.email === "string") return claims.email;
  if (Array.isArray(claims.emails) && claims.emails.length > 0) return claims.emails[0];
  const username = account.username || "";
  if (username.includes("@") && !username.match(/^[0-9a-f-]+@/)) return username;
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
      // Set ownerEmail first as fallback, then override with MSAL email if available
      if (res.data.ownerEmail) {
        setEmail(res.data.ownerEmail);
      }
      if (accounts.length > 0) {
        const msalEmail = extractEmail(accounts[0]);
        if (msalEmail) setEmail(msalEmail);
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
            value={email}
            disabled
            fullWidth
            helperText={email.match(/^[0-9a-f-]+@/) ? "Full email visible when using the deployed app" : ""}
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
