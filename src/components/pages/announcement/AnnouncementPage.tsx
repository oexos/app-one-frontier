import { useMsal } from "@azure/msal-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useSelector, useDispatch } from "react-redux";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Pagination,
} from "@mui/material";
import dayjs from "dayjs";
import type { RootState, AppDispatch } from "../../../redux-toolkit/store";
import { triggerAnnouncementRefresh, setShowAnnouncementForm } from "./announcementSlice";
import { searchAnnouncements, createAnnouncement } from "./announcementApiService";
import type { AnnouncementData } from "./announcementApiService";
import style from "./AnnouncementPage.module.css";

interface CreateInputs {
  title: string;
  content: string;
  category: string;
}

const categoryColorMap: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  GENERAL: "default",
  HEALTH: "success",
  EMERGENCY: "error",
  EVENT: "info",
  CURFEW: "warning",
};

const AnnouncementPage: React.FC = () => {
  const { instance, accounts, inProgress } = useMsal();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { refreshTrigger, showCreateForm } = useSelector((state: RootState) => state.announcement);

  const [announcements, setAnnouncements] = useState<AnnouncementData[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (inProgress === "none" && accounts.length <= 0) {
      navigate("/");
    }
  }, [accounts, inProgress]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await searchAnnouncements({
          isActive: true,
          page: page - 1,
          size: pageSize,
          sortBy: "publishedAt",
          sortDirection: "DESC",
        });
        setAnnouncements(response.data.items);
        setTotalCount(response.data.totalCount);
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setLoading(false);
      }
    };
    if (accounts.length > 0) fetchData();
  }, [page, refreshTrigger, accounts]);

  const { control, handleSubmit, formState, trigger, reset } = useForm<CreateInputs>({
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: { title: "", content: "", category: "" },
  });

  useEffect(() => {
    if (showCreateForm) {
      const timer = setTimeout(() => trigger(), 0);
      return () => clearTimeout(timer);
    }
  }, [showCreateForm, trigger]);

  const oneOfTheFieldsHasErrors = Object.keys(formState.errors).length > 0;
  const oneOfTheFieldsIsDirty = Object.keys(formState.dirtyFields).length > 0;

  const onSubmit: SubmitHandler<CreateInputs> = async (data) => {
    setSubmitError("");
    try {
      await createAnnouncement({
        title: data.title,
        content: data.content,
        category: data.category,
      });
      dispatch(setShowAnnouncementForm(false));
      dispatch(triggerAnnouncementRefresh());
      reset();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { errorDetail?: string } } };
      setSubmitError(err.response?.data?.errorDetail || "Failed to create announcement.");
    }
  };

  const onError: SubmitErrorHandler<CreateInputs> = (errors) => console.error(errors);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <Box className={style.container}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            BarangayConnect - Announcements
          </Typography>
          <Button color="inherit" onClick={() => navigate("/dashboard")}>Dashboard</Button>
          <Button color="inherit" onClick={() => instance.logoutPopup()}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="h5">Announcements</Typography>
          <Button variant="contained" onClick={() => dispatch(setShowAnnouncementForm(true))}>
            Create Announcement
          </Button>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {announcements.map((ann) => (
              <Card key={ann.id}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <Typography variant="h6">{ann.title}</Typography>
                    <Chip
                      label={ann.category}
                      color={categoryColorMap[ann.category] || "default"}
                      size="small"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {ann.publishedAt ? dayjs(ann.publishedAt).format("MMMM D, YYYY h:mm A") : ""}
                  </Typography>
                  <Typography variant="body1">{ann.content}</Typography>
                </CardContent>
              </Card>
            ))}

            {announcements.length === 0 && (
              <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                No announcements yet.
              </Typography>
            )}

            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" sx={{ mt: 2 }}>
                <Pagination count={totalPages} page={page} onChange={(_e, p) => setPage(p)} />
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Dialog
        open={showCreateForm}
        onClose={() => dispatch(setShowAnnouncementForm(false))}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Announcement</DialogTitle>
        <DialogContent>
          {submitError && <Alert severity="error" sx={{ mb: 2, mt: 1 }}>{submitError}</Alert>}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Controller
              name="title"
              control={control}
              rules={{ required: "Title is required" }}
              render={({ field }) => (
                <TextField label="Title" variant="outlined" fullWidth required
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field} />
              )}
            />

            <Controller
              name="category"
              control={control}
              rules={{ required: "Category is required" }}
              render={({ field }) => (
                <TextField label="Category" variant="outlined" fullWidth select required
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field}>
                  <MenuItem value="GENERAL">General</MenuItem>
                  <MenuItem value="HEALTH">Health</MenuItem>
                  <MenuItem value="EMERGENCY">Emergency</MenuItem>
                  <MenuItem value="EVENT">Event</MenuItem>
                  <MenuItem value="CURFEW">Curfew</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="content"
              control={control}
              rules={{ required: "Content is required" }}
              render={({ field }) => (
                <TextField label="Content" variant="outlined" fullWidth multiline rows={6} required
                  sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }} {...field} />
              )}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { dispatch(setShowAnnouncementForm(false)); reset(); setSubmitError(""); }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleSubmit(onSubmit, onError)()}
            disabled={oneOfTheFieldsHasErrors || !oneOfTheFieldsIsDirty || formState.isSubmitting}
          >
            {formState.isSubmitting ? <CircularProgress size={24} /> : "Publish"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AnnouncementPage;
