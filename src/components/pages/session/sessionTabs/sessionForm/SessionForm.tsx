import Button from "@mui/material/Button";
import Modal from "@mui/material/Modal";
import TextField from "@mui/material/TextField";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { debounce, type DebouncedFunc } from "lodash";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";

import MenuItem from "@mui/material/MenuItem";
import {
  Controller,
  useForm,
  type SubmitErrorHandler,
  type SubmitHandler,
  type ValidateResult,
} from "react-hook-form";
import type { RootState } from "../../../../../redux-toolkit/store";
import {
  setIsShowSessionForm,
  setIsTriggerSessionSearching,
} from "../../sessionSlice";
import { createSession, type Session } from "../sessionTable/sessionApiService";
import style from "./SessionForm.module.css";

dayjs.extend(utc);
dayjs.extend(timezone);

const prioritList = [
  {
    value: "P1",
    label: "P1",
  },
  {
    value: "P2",
    label: "P2",
  },
  {
    value: "P3",
    label: "P3",
  },
];

type Inputs = {
  startTime: dayjs.Dayjs;
  endTime: dayjs.Dayjs;
  title: string | null;
  speaker: string;
  priority: string;
};

const SessionForm: React.FC = () => {
  const dispatch = useDispatch();
  const debounceRef = useRef<DebouncedFunc<() => void>>(undefined);
  const isShowSessionForm = useSelector(
    (state: RootState) => state.session.isShowSessionForm
  );

  const handleClose = () => {
    dispatch(setIsShowSessionForm(false));
  };

  const saveSession = async (data: Inputs) => {
    const session: Session = {
      startTime: data.startTime?.format() || "",
      endTime: data.endTime?.format() || "",
      title: data.title ?? "",
      priority: data.priority,
      speaker: data.speaker,
    };
    try {
      await createSession(session);
      dispatch(setIsTriggerSessionSearching(true));
      dispatch(setIsShowSessionForm(false));
    } catch (error: unknown) {
      console.error(error);
    }
  };

  useEffect(() => {
    dispatch(setIsTriggerSessionSearching(false));
    setTimeout(() => {
      trigger();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { control, trigger, formState, handleSubmit } = useForm<Inputs>({
    defaultValues: {
      startTime: dayjs(),
      endTime: dayjs(),
      title: "",
      speaker: "",
      priority: "",
    },
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
  });

  const onSubmit: SubmitHandler<Inputs> = (data) => saveSession(data);

  const onError: SubmitErrorHandler<Inputs> = (error) => console.error(error);

  const oneOfTheFieldsHasErrors = Object.keys(formState.errors).length > 0;

  const oneOfTheFieldIsValidating =
    Object.keys(formState.validatingFields).length > 0;

  const oneOfTheFieldsIsDirty = Object.keys(formState.dirtyFields).length > 0;

  const isSubmitDisabled =
    oneOfTheFieldIsValidating ||
    oneOfTheFieldsHasErrors ||
    !oneOfTheFieldsIsDirty ||
    formState.isSubmitting ||
    formState.isLoading;

  return (
    <>
      <Modal open={isShowSessionForm} onClose={handleClose}>
        <div className={style.modalContent}>
          <div className={style.parentDiv}>
            <h3>New Session Form</h3>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <div className={style.grid}>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label="Start Date Time (UTC)"
                      timezone="UTC"
                      className={style.dateTime}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <DateTimePicker
                      label="End Date Time (UTC)"
                      timezone="UTC"
                      className={style.dateTime}
                      {...field}
                    />
                  )}
                />
                <Controller
                  name="title"
                  control={control}
                  rules={{
                    required: "This is required",
                  }}
                  render={({ field }) => (
                    <>
                      <TextField
                        label="Title"
                        variant="outlined"
                        fullWidth
                        required
                        sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                        error={
                          (formState.dirtyFields.title ||
                            formState.touchedFields.title) &&
                          !formState.isSubmitting &&
                          Boolean(formState.errors.title?.types?.required)
                        }
                        {...field}
                      />
                      {(formState.dirtyFields.title ||
                        formState.touchedFields.title) &&
                        !formState.isSubmitting && (
                          <>
                            {formState.errors.title?.types?.required && (
                              <div style={{ color: "red", fontSize: "0.8rem" }}>
                                {formState.errors.title.types.required}
                              </div>
                            )}
                          </>
                        )}
                    </>
                  )}
                />
                <Controller
                  name="speaker"
                  control={control}
                  rules={{
                    required: "This is required",
                    validate: {
                      debounceValidation: (
                        value
                      ): Promise<ValidateResult> => {
                        debounceRef.current?.cancel();
                        return new Promise((resolve) => {
                          debounceRef.current = debounce(() => {
                            if (value.includes("error")) {
                              resolve("'error' not allowed.");
                            } else {
                              resolve(true);
                            }
                          }, 1500);
                          debounceRef.current();
                        });
                      },
                    },
                  }}
                  render={({ field }) => (
                    <>
                      <TextField
                        label="Speaker"
                        variant="outlined"
                        fullWidth
                        required
                        sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                        error={
                          (formState.dirtyFields.speaker ||
                            formState.touchedFields.speaker) &&
                          !formState.isSubmitting &&
                          Boolean(
                            formState.errors.speaker?.types?.required ||
                              formState.errors.speaker?.types
                                ?.debounceValidation
                          )
                        }
                        {...field}
                      />
                      {(formState.dirtyFields.speaker ||
                        formState.touchedFields.speaker) &&
                        !formState.isSubmitting && (
                          <>
                            {formState.validatingFields.speaker && (
                              <div
                                style={{ color: "blue", fontSize: "0.8rem" }}
                              >
                                Validating...
                              </div>
                            )}
                            {!formState.validatingFields.speaker &&
                              formState.errors.speaker?.types?.required && (
                                <div style={{ color: "red", fontSize: "0.8rem" }}>
                                  {formState.errors.speaker.types.required}
                                </div>
                              )}
                            {!formState.validatingFields.speaker &&
                              formState.errors.speaker?.types
                                ?.debounceValidation && (
                                <div style={{ color: "red", fontSize: "0.8rem" }}>
                                  {
                                    formState.errors.speaker.types
                                      .debounceValidation
                                  }
                                </div>
                              )}
                          </>
                        )}
                    </>
                  )}
                />
                <Controller
                  name="priority"
                  control={control}
                  rules={{
                    required: "This is required",
                  }}
                  render={({ field }) => (
                    <>
                      <TextField
                        label="Priority"
                        variant="outlined"
                        select={true}
                        fullWidth
                        required
                        sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                        error={
                          (formState.dirtyFields.priority ||
                            formState.touchedFields.priority) &&
                          !formState.isSubmitting &&
                          Boolean(formState.errors.priority?.types?.required)
                        }
                        {...field}
                      >
                        {prioritList.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                      {(formState.dirtyFields.priority ||
                        formState.touchedFields.priority) &&
                        !formState.isSubmitting && (
                          <>
                            {formState.errors.priority?.types?.required && (
                              <div style={{ color: "red", fontSize: "0.8rem" }}>
                                {formState.errors.priority.types.required}
                              </div>
                            )}
                          </>
                        )}
                    </>
                  )}
                />
                <Button
                  variant="contained"
                  onClick={() => handleSubmit(onSubmit, onError)()}
                  disabled={isSubmitDisabled}
                >
                  Save Session
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => dispatch(setIsShowSessionForm(false))}
                >
                  Cancel
                </Button>
              </div>
            </LocalizationProvider>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default SessionForm;
