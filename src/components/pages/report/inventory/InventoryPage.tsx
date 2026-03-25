import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { searchProducts, restockProduct, ProductResponse } from "../../product/productApiService";
import {
  Typography, Card, CardContent, IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import InfiniteScrollList from "../../../shared/InfiniteScrollList";
import { LayoutContext } from "../../../layout/AuthenticatedLayout";
import style from "./InventoryPage.module.css";

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [lowStockOnly, setLowStockOnly] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [restockDialog, setRestockDialog] = useState<ProductResponse | null>(null);
  const [addQty, setAddQty] = useState("");
  const [newCostPrice, setNewCostPrice] = useState("");

  const loadProducts = useCallback(async (pageNum: number, append: boolean) => {
    setIsLoading(true);
    try {
      const res = await searchProducts({
        page: pageNum,
        size: 20,
        lowStockOnly,
        sortBy: lowStockOnly ? "quantity" : "name",
      });
      if (append) {
        setProducts((prev) => [...prev, ...res.data.content]);
      } else {
        setProducts(res.data.content);
      }
      setHasNext(res.data.hasNext);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [lowStockOnly]);

  useEffect(() => {
    setPage(0);
    loadProducts(0, false);
  }, [loadProducts]);

  const fetchNextPage = () => {
    const next = page + 1;
    setPage(next);
    loadProducts(next, true);
  };

  const handleRestock = async () => {
    if (!restockDialog || !addQty) return;
    try {
      await restockProduct(restockDialog.id, {
        addQuantity: parseInt(addQty),
        newCostPrice: newCostPrice ? parseFloat(newCostPrice) : null,
      });
      showSnackbar("Product restocked");
      setRestockDialog(null);
      setAddQty("");
      setNewCostPrice("");
      setPage(0);
      loadProducts(0, false);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to restock", "error");
    }
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Tooltip title="Back to reports" arrow>
          <IconButton onClick={() => navigate("/reports")}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" fontWeight={600}>Inventory</Typography>
      </div>

      <div className={style.tabs}>
        <Tooltip title="Products at or below their alert threshold" arrow>
          <Chip label="Low Stock" onClick={() => setLowStockOnly(true)} sx={{ "&&": { backgroundColor: lowStockOnly ? "#d32f2f" : "#e0e0e0", color: lowStockOnly ? "#fff" : "#333" }, fontWeight: lowStockOnly ? 600 : 400 }} />
        </Tooltip>
        <Tooltip title="View all products with stock info" arrow>
          <Chip label="All Products" onClick={() => setLowStockOnly(false)} sx={{ "&&": { backgroundColor: !lowStockOnly ? "#1976d2" : "#e0e0e0", color: !lowStockOnly ? "#fff" : "#333" }, fontWeight: !lowStockOnly ? 600 : 400 }} />
        </Tooltip>
      </div>

      <InfiniteScrollList fetchNextPage={fetchNextPage} hasNextPage={hasNext} isLoading={isLoading}>
        <div className={style.list}>
          {products.map((product) => (
            <Card key={product.id}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Typography variant="body1" fontWeight={500}>{product.name}</Typography>
                  <Tooltip title="Current stock vs low stock alert level" arrow>
                    <Typography variant="body2" color={product.isLowStock ? "error" : "text.secondary"}>
                      Stock: {product.quantity} / Threshold: {product.lowStockThreshold}
                    </Typography>
                  </Tooltip>
                  <Typography variant="caption" color="text.secondary">
                    Cost: ₱{product.costPrice.toFixed(2)} | Sell: ₱{product.sellingPrice.toFixed(2)}
                  </Typography>
                </div>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => { setRestockDialog(product); setAddQty(""); setNewCostPrice(""); }}
                >
                  Restock
                </Button>
              </CardContent>
            </Card>
          ))}
          {products.length === 0 && !isLoading && (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              {lowStockOnly ? "No low stock products!" : "No products found"}
            </Typography>
          )}
        </div>
      </InfiniteScrollList>

      <Dialog open={restockDialog !== null} onClose={() => setRestockDialog(null)} fullWidth maxWidth="xs">
        <DialogTitle>Restock: {restockDialog?.name}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "24px !important", overflow: "visible" }}>
          <Typography variant="body2" color="text.secondary">
            Current stock: {restockDialog?.quantity}
          </Typography>
          <TextField
            label="Quantity to Add"
            type="number"
            fullWidth
            required
            value={addQty}
            onChange={(e) => setAddQty(e.target.value)}
            inputProps={{ inputMode: "numeric", min: 1, step: 1 }}
            onKeyDown={(e) => { if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault(); }}
            autoFocus
            sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
          />
          <TextField
            label="New Cost Price (optional)"
            type="number"
            fullWidth
            value={newCostPrice}
            onChange={(e) => setNewCostPrice(e.target.value)}
            inputProps={{ inputMode: "decimal", min: 0, step: "any" }}
            onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
            helperText="Leave empty to keep current cost price"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestockDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleRestock} disabled={!addQty || parseInt(addQty) <= 0}>
            Restock
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default InventoryPage;
