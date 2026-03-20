import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Controller, useForm } from "react-hook-form";
import type { SubmitHandler, SubmitErrorHandler } from "react-hook-form";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  TextField,
  MenuItem,
  Paper,
  CircularProgress,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { createResident } from "./registerApiService";
import style from "./RegisterPage.module.css";

interface Inputs {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: Dayjs | null;
  gender: string;
  civilStatus: string;
  contactNumber: string;
  address: string;
  residenceSince: Dayjs | null;
}

const RegisterPage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (inProgress === "none" && accounts.length <= 0) {
      navigate("/");
    }
  }, [accounts, inProgress]);

  const { control, handleSubmit, formState, trigger } = useForm<Inputs>({
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: null,
      gender: "",
      civilStatus: "",
      contactNumber: "",
      address: "",
      residenceSince: null,
    },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      trigger();
    }, 0);
    return () => clearTimeout(timer);
  }, [trigger]);

  const oneOfTheFieldsHasErrors = Object.keys(formState.errors).length > 0;
  const oneOfTheFieldsIsDirty = Object.keys(formState.dirtyFields).length > 0;
  const isSubmitDisabled =
    oneOfTheFieldsHasErrors || !oneOfTheFieldsIsDirty || formState.isSubmitting || submitting;

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    setSubmitting(true);
    try {
      await createResident({
        firstName: data.firstName,
        middleName: data.middleName || undefined,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.format("YYYY-MM-DD") : "",
        gender: data.gender,
        civilStatus: data.civilStatus,
        contactNumber: data.contactNumber,
        address: data.address,
        residenceSince: data.residenceSince ? data.residenceSince.format("YYYY-MM-DD") : "",
      });
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const onError: SubmitErrorHandler<Inputs> = (errors) => {
    console.error("Form validation errors:", errors);
  };

  return (
    <Box className={style.container}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            BarangayConnect - Register
          </Typography>
          <Button color="inherit" onClick={() => instance.logoutPopup()}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Resident Registration
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Complete your profile to access barangay services
          </Typography>

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Controller
                name="firstName"
                control={control}
                rules={{ required: "First name is required" }}
                render={({ field }) => (
                  <>
                    <TextField
                      label="First Name"
                      variant="outlined"
                      fullWidth
                      required
                      sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                      error={
                        (formState.dirtyFields.firstName || formState.touchedFields.firstName) &&
                        !formState.isSubmitting &&
                        Boolean(formState.errors.firstName?.types?.required)
                      }
                      {...field}
                    />
                    {(formState.dirtyFields.firstName || formState.touchedFields.firstName) &&
                      !formState.isSubmitting &&
                      formState.errors.firstName?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.firstName.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Controller
                name="middleName"
                control={control}
                render={({ field }) => (
                  <TextField label="Middle Name" variant="outlined" fullWidth {...field} />
                )}
              />

              <Controller
                name="lastName"
                control={control}
                rules={{ required: "Last name is required" }}
                render={({ field }) => (
                  <>
                    <TextField
                      label="Last Name"
                      variant="outlined"
                      fullWidth
                      required
                      sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                      error={
                        (formState.dirtyFields.lastName || formState.touchedFields.lastName) &&
                        !formState.isSubmitting &&
                        Boolean(formState.errors.lastName?.types?.required)
                      }
                      {...field}
                    />
                    {(formState.dirtyFields.lastName || formState.touchedFields.lastName) &&
                      !formState.isSubmitting &&
                      formState.errors.lastName?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.lastName.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Controller
                name="dateOfBirth"
                control={control}
                rules={{ required: "Date of birth is required" }}
                render={({ field }) => (
                  <>
                    <DatePicker
                      label="Date of Birth *"
                      value={field.value}
                      onChange={field.onChange}
                      maxDate={dayjs()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error:
                            (formState.dirtyFields.dateOfBirth || formState.touchedFields.dateOfBirth) &&
                            !formState.isSubmitting &&
                            Boolean(formState.errors.dateOfBirth),
                        },
                      }}
                    />
                    {(formState.dirtyFields.dateOfBirth || formState.touchedFields.dateOfBirth) &&
                      !formState.isSubmitting &&
                      formState.errors.dateOfBirth?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.dateOfBirth.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Controller
                name="gender"
                control={control}
                rules={{ required: "Gender is required" }}
                render={({ field }) => (
                  <>
                    <TextField
                      label="Gender"
                      variant="outlined"
                      fullWidth
                      select
                      required
                      sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                      error={
                        (formState.dirtyFields.gender || formState.touchedFields.gender) &&
                        !formState.isSubmitting &&
                        Boolean(formState.errors.gender?.types?.required)
                      }
                      {...field}
                    >
                      <MenuItem value="MALE">Male</MenuItem>
                      <MenuItem value="FEMALE">Female</MenuItem>
                      <MenuItem value="OTHER">Other</MenuItem>
                    </TextField>
                    {(formState.dirtyFields.gender || formState.touchedFields.gender) &&
                      !formState.isSubmitting &&
                      formState.errors.gender?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.gender.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Controller
                name="civilStatus"
                control={control}
                rules={{ required: "Civil status is required" }}
                render={({ field }) => (
                  <>
                    <TextField
                      label="Civil Status"
                      variant="outlined"
                      fullWidth
                      select
                      required
                      sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                      error={
                        (formState.dirtyFields.civilStatus || formState.touchedFields.civilStatus) &&
                        !formState.isSubmitting &&
                        Boolean(formState.errors.civilStatus?.types?.required)
                      }
                      {...field}
                    >
                      <MenuItem value="SINGLE">Single</MenuItem>
                      <MenuItem value="MARRIED">Married</MenuItem>
                      <MenuItem value="WIDOWED">Widowed</MenuItem>
                      <MenuItem value="SEPARATED">Separated</MenuItem>
                    </TextField>
                    {(formState.dirtyFields.civilStatus || formState.touchedFields.civilStatus) &&
                      !formState.isSubmitting &&
                      formState.errors.civilStatus?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.civilStatus.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Controller
                name="contactNumber"
                control={control}
                rules={{ required: "Contact number is required" }}
                render={({ field }) => (
                  <>
                    <TextField
                      label="Contact Number"
                      variant="outlined"
                      fullWidth
                      required
                      sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                      error={
                        (formState.dirtyFields.contactNumber || formState.touchedFields.contactNumber) &&
                        !formState.isSubmitting &&
                        Boolean(formState.errors.contactNumber?.types?.required)
                      }
                      {...field}
                    />
                    {(formState.dirtyFields.contactNumber || formState.touchedFields.contactNumber) &&
                      !formState.isSubmitting &&
                      formState.errors.contactNumber?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.contactNumber.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Controller
                name="address"
                control={control}
                rules={{ required: "Address is required" }}
                render={({ field }) => (
                  <>
                    <TextField
                      label="Address"
                      variant="outlined"
                      fullWidth
                      multiline
                      rows={2}
                      required
                      sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                      error={
                        (formState.dirtyFields.address || formState.touchedFields.address) &&
                        !formState.isSubmitting &&
                        Boolean(formState.errors.address?.types?.required)
                      }
                      {...field}
                    />
                    {(formState.dirtyFields.address || formState.touchedFields.address) &&
                      !formState.isSubmitting &&
                      formState.errors.address?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.address.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Controller
                name="residenceSince"
                control={control}
                rules={{ required: "Residence start date is required" }}
                render={({ field }) => (
                  <>
                    <DatePicker
                      label="Living in Barangay Since *"
                      value={field.value}
                      onChange={field.onChange}
                      maxDate={dayjs()}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error:
                            (formState.dirtyFields.residenceSince ||
                              formState.touchedFields.residenceSince) &&
                            !formState.isSubmitting &&
                            Boolean(formState.errors.residenceSince),
                        },
                      }}
                    />
                    {(formState.dirtyFields.residenceSince ||
                      formState.touchedFields.residenceSince) &&
                      !formState.isSubmitting &&
                      formState.errors.residenceSince?.types?.required && (
                        <div style={{ color: "red", fontSize: "0.8rem" }}>
                          {formState.errors.residenceSince.types.required}
                        </div>
                      )}
                  </>
                )}
              />

              <Button
                variant="contained"
                size="large"
                onClick={() => handleSubmit(onSubmit, onError)()}
                disabled={isSubmitDisabled}
              >
                {submitting ? <CircularProgress size={24} /> : "Register"}
              </Button>
            </Box>
          </LocalizationProvider>
        </Paper>
      </Box>
    </Box>
  );
};

export default RegisterPage;
