import { useEffect, useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux-toolkit/store";
import { triggerProductRefresh } from "../productSlice";
import { useForm, Controller } from "react-hook-form";
import {
  TextField, Button, Card, CardContent, Typography, Switch, FormControlLabel,
  Select, MenuItem, InputLabel, FormControl, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import { getProduct, createProduct, updateProduct, deleteProduct, getCategories, CategoryResponse } from "../productApiService";
import { LayoutContext } from "../../../layout/AuthenticatedLayout";
import style from "./AddEditProductPage.module.css";

interface Inputs {
  name: string;
  sellingPrice: string;
  costPrice: string;
  quantity: string;
  lowStockThreshold: string;
  categoryId: string;
  isFavorite: boolean;
}

const AddEditProductPage: React.FC = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [priceWarning, setPriceWarning] = useState(false);

  const { control, handleSubmit, formState, reset, watch } = useForm<Inputs>({
    mode: "all",
    reValidateMode: "onChange",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      sellingPrice: "",
      costPrice: "",
      quantity: "",
      lowStockThreshold: "5",
      categoryId: "",
      isFavorite: false,
    },
  });

  const sellingPrice = watch("sellingPrice");
  const costPrice = watch("costPrice");

  useEffect(() => {
    const sp = parseFloat(sellingPrice);
    const cp = parseFloat(costPrice);
    setPriceWarning(!isNaN(sp) && !isNaN(cp) && cp >= sp && sp > 0);
  }, [sellingPrice, costPrice]);

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      getProduct(Number(id)).then((res) => {
        const p = res.data;
        reset({
          name: p.name,
          sellingPrice: String(p.sellingPrice),
          costPrice: String(p.costPrice),
          quantity: String(p.quantity),
          lowStockThreshold: String(p.lowStockThreshold),
          categoryId: p.categoryId ? String(p.categoryId) : "",
          isFavorite: p.isFavorite,
        });
      }).catch(() => {
        showSnackbar("Product not found", "error");
        navigate("/products");
      });
    }
  }, [isEdit, id, reset, showSnackbar, navigate]);

  const oneOfTheFieldsHasErrors = Object.keys(formState.errors).length > 0;
  const oneOfTheFieldsIsDirty = Object.keys(formState.dirtyFields).length > 0;

  const onSubmit = async (data: Inputs) => {
    const payload = {
      name: data.name,
      sellingPrice: parseFloat(data.sellingPrice),
      costPrice: parseFloat(data.costPrice),
      quantity: parseInt(data.quantity),
      lowStockThreshold: parseInt(data.lowStockThreshold),
      categoryId: data.categoryId ? Number(data.categoryId) : null,
      isFavorite: data.isFavorite,
    };
    try {
      if (isEdit && id) {
        await updateProduct(Number(id), payload);
        showSnackbar("Product updated");
      } else {
        await createProduct(payload);
        showSnackbar("Product added");
      }
      dispatch(triggerProductRefresh());
      navigate("/products");
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { errorDetail?: string } } };
      showSnackbar(error.response?.data?.errorDetail || "Failed to save product", "error");
    }
  };

  const onError = (error: unknown) => console.error(error);

  const handleDelete = async () => {
    try {
      await deleteProduct(Number(id));
      dispatch(triggerProductRefresh());
      showSnackbar("Product deleted");
      navigate("/products");
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete product", "error");
    }
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <IconButton onClick={() => navigate("/products")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={600}>
          {isEdit ? "Edit Product" : "Add Product"}
        </Typography>
        {isEdit && (
          <IconButton color="error" onClick={() => setDeleteConfirm(true)}>
            <DeleteIcon />
          </IconButton>
        )}
      </div>

      <Card sx={{ mx: 2, mt: 1 }}>
        <CardContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Controller
            name="name"
            control={control}
            rules={{ required: "Product name is required" }}
            render={({ field }) => (
              <TextField
                label="Product Name"
                fullWidth
                required
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                error={Boolean(formState.dirtyFields.name && formState.errors.name)}
                helperText={formState.dirtyFields.name && formState.errors.name?.message}
                {...field}
              />
            )}
          />

          <Controller
            name="sellingPrice"
            control={control}
            rules={{
              required: "Selling price is required",
              validate: (v) => (parseFloat(v) > 0) || "Must be greater than 0",
            }}
            render={({ field }) => (
              <TextField
                label="Selling Price"
                fullWidth
                required
                type="number"
                inputProps={{ inputMode: "decimal", min: 0, step: "any" }}
                onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                error={Boolean(formState.dirtyFields.sellingPrice && formState.errors.sellingPrice)}
                helperText={formState.dirtyFields.sellingPrice && formState.errors.sellingPrice?.message}
                {...field}
              />
            )}
          />

          <Controller
            name="costPrice"
            control={control}
            rules={{
              required: "Cost price is required",
              validate: (v) => (parseFloat(v) > 0) || "Must be greater than 0",
            }}
            render={({ field }) => (
              <TextField
                label="Cost Price"
                fullWidth
                required
                type="number"
                inputProps={{ inputMode: "decimal", min: 0, step: "any" }}
                onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                error={Boolean(formState.dirtyFields.costPrice && formState.errors.costPrice)}
                helperText={formState.dirtyFields.costPrice && formState.errors.costPrice?.message}
                {...field}
              />
            )}
          />

          {priceWarning && (
            <Typography variant="body2" color="warning.main" sx={{ mt: -1 }}>
              Cost price is higher than or equal to selling price. Are you sure?
            </Typography>
          )}

          <Controller
            name="quantity"
            control={control}
            rules={{
              required: "Quantity is required",
              validate: (v) => (parseInt(v) >= 0) || "Must be 0 or more",
            }}
            render={({ field }) => (
              <TextField
                label="Initial Stock"
                fullWidth
                required
                type="number"
                inputProps={{ inputMode: "numeric", min: 0, step: 1 }}
                onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
                error={Boolean(formState.dirtyFields.quantity && formState.errors.quantity)}
                helperText={formState.dirtyFields.quantity && formState.errors.quantity?.message}
                {...field}
              />
            )}
          />

          <Controller
            name="lowStockThreshold"
            control={control}
            rules={{ required: "Required" }}
            render={({ field }) => (
              <TextField
                label="Low Stock Alert Threshold"
                fullWidth
                type="number"
                inputProps={{ inputMode: "numeric", min: 0, step: 1 }}
                onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
                {...field}
              />
            )}
          />

          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select label="Category" {...field}>
                  <MenuItem value="">None (Uncategorized)</MenuItem>
                  {categories.map((cat) => (
                    <MenuItem key={cat.id} value={String(cat.id)}>{cat.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="isFavorite"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Favorite (pinned to Sell screen)"
              />
            )}
          />

          <Button
            variant="contained"
            size="large"
            fullWidth
            sx={{ mt: 1, py: 1.2, borderRadius: 2 }}
            onClick={() => handleSubmit(onSubmit, onError)()}
            disabled={oneOfTheFieldsHasErrors || !oneOfTheFieldsIsDirty || formState.isSubmitting}
          >
            {formState.isSubmitting ? "Saving..." : isEdit ? "Update Product" : "Add Product"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently delete this product. Past sales records will be preserved.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button color="error" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AddEditProductPage;
