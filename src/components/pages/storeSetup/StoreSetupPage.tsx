import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useForm, Controller } from "react-hook-form";
import { TextField, Button, Card, CardContent, Typography } from "@mui/material";
import { createStore } from "./storeApiService";
import style from "./StoreSetupPage.module.css";

interface Inputs {
  storeName: string;
}

const StoreSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState("");

  const { control, handleSubmit, formState, trigger } = useForm<Inputs>({
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: { storeName: "" },
  });

  useEffect(() => {
    const timeout = setTimeout(() => { trigger(); }, 100);
    return () => clearTimeout(timeout);
  }, [trigger]);

  const oneOfTheFieldsHasErrors = Object.keys(formState.errors).length > 0;
  const oneOfTheFieldIsValidating = Object.keys(formState.validatingFields).length > 0;
  const oneOfTheFieldsIsDirty = Object.keys(formState.dirtyFields).length > 0;

  const onSubmit = async (data: Inputs) => {
    try {
      setSubmitError("");
      await createStore(data.storeName);
      navigate("/sell");
    } catch (err: unknown) {
      console.error(err);
      setSubmitError("Failed to create store. Please try again.");
    }
  };

  const onError = (error: unknown) => {
    console.error(error);
  };

  return (
    <div className={style.container}>
      <Card sx={{ maxWidth: 400, width: "100%", mx: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Welcome to TindahanPOS!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter your store name to get started.
          </Typography>

          <Controller
            name="storeName"
            control={control}
            rules={{ required: "Store name is required" }}
            render={({ field }) => (
              <>
                <TextField
                  label="Store Name"
                  variant="outlined"
                  fullWidth
                  required
                  placeholder="e.g., Maria's Sari-Sari Store"
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                  error={
                    (formState.dirtyFields.storeName || formState.touchedFields.storeName) &&
                    !formState.isSubmitting &&
                    Boolean(formState.errors.storeName?.types?.required)
                  }
                  {...field}
                />
                {(formState.dirtyFields.storeName || formState.touchedFields.storeName) &&
                  !formState.isSubmitting && (
                    <>
                      {formState.errors.storeName?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem", marginTop: 4 }}>
                          {formState.errors.storeName.types.required}
                        </div>
                      )}
                    </>
                  )}
              </>
            )}
          />

          {submitError && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {submitError}
            </Typography>
          )}

          <Button
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
            onClick={() => handleSubmit(onSubmit, onError)()}
            disabled={oneOfTheFieldsHasErrors || oneOfTheFieldIsValidating || !oneOfTheFieldsIsDirty || formState.isSubmitting || formState.isLoading}
          >
            {formState.isSubmitting ? "Creating..." : "Start Selling"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreSetupPage;
