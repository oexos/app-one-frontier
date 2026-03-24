import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux-toolkit/store";
import { triggerProductRefresh } from "../productSlice";
import {
  Typography, Card, CardContent, IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { getCategories, createCategory, updateCategory, deleteCategory, CategoryResponse } from "../productApiService";
import { LayoutContext } from "../../../layout/AuthenticatedLayout";
import style from "./CategoryPage.module.css";

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadCategories = () => {
    getCategories().then((res) => setCategories(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleSave = async () => {
    if (!categoryName.trim()) return;
    try {
      if (editingId) {
        await updateCategory(editingId, categoryName.trim());
        showSnackbar("Category updated");
      } else {
        await createCategory(categoryName.trim());
        showSnackbar("Category added");
      }
      dispatch(triggerProductRefresh());
      loadCategories();
      setDialogOpen(false);
      setCategoryName("");
      setEditingId(null);
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { errorDetail?: string } } };
      showSnackbar(error.response?.data?.errorDetail || "Failed to save category", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteCategory(id);
      dispatch(triggerProductRefresh());
      showSnackbar("Category deleted");
      loadCategories();
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete category", "error");
    }
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Tooltip title="Back to products" arrow>
          <IconButton onClick={() => navigate("/products")}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>Categories</Typography>
        <Tooltip title="Add a new category" arrow>
          <Button
            startIcon={<AddIcon />}
            onClick={() => { setEditingId(null); setCategoryName(""); setDialogOpen(true); }}
          >
            Add
          </Button>
        </Tooltip>
      </div>

      <div className={style.list}>
        {categories.map((cat) => (
          <Card key={cat.id} className={style.card}>
            <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <Typography variant="body1" fontWeight={500}>{cat.name}</Typography>
                <Tooltip title="Number of products in this category" arrow>
                  <Typography variant="caption" color="text.secondary">{cat.productCount} products</Typography>
                </Tooltip>
              </div>
              <div>
                <Tooltip title="Rename this category" arrow>
                  <IconButton onClick={() => { setEditingId(cat.id); setCategoryName(cat.name); setDialogOpen(true); }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete this category" arrow>
                  <IconButton color="error" onClick={() => setDeleteConfirm(cat.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        ))}
        {categories.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
            No categories yet. Add one to organize your products.
          </Typography>
        )}
      </div>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingId ? "Edit Category" : "Add Category"}</DialogTitle>
        <DialogContent sx={{ overflow: "visible", pt: "16px !important" }}>
          <TextField
            autoFocus
            fullWidth
            label="Category Name"
            required
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            sx={{ mt: 1, "& .MuiFormLabel-asterisk": { color: "red" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!categoryName.trim()}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Category?</DialogTitle>
        <DialogContent>
          <Typography>Products in this category will become uncategorized.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default CategoryPage;
