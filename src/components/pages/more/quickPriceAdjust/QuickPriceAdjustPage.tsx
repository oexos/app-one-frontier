import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import {
  Typography, Card, CardContent, IconButton, Checkbox, Button, TextField,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Divider, Tooltip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { searchProducts, bulkPriceAdjust, ProductResponse } from "../../product/productApiService";
import { LayoutContext } from "../../../layout/AuthenticatedLayout";
import style from "./QuickPriceAdjustPage.module.css";

const QuickPriceAdjustPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [sellingPriceAction, setSellingPriceAction] = useState("NO_CHANGE");
  const [sellingPriceAmount, setSellingPriceAmount] = useState("");
  const [costPriceAction, setCostPriceAction] = useState("NO_CHANGE");
  const [costPriceAmount, setCostPriceAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    searchProducts({ size: 100 })
      .then((res) => setProducts(res.data.content))
      .catch(console.error);
  }, []);

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      await bulkPriceAdjust({
        productIds: Array.from(selectedIds),
        selectAll,
        categoryId: null,
        search: null,
        sellingPriceAction,
        sellingPriceAmount: sellingPriceAmount ? parseFloat(sellingPriceAmount) : 0,
        costPriceAction,
        costPriceAmount: costPriceAmount ? parseFloat(costPriceAmount) : 0,
        preview: false,
      });
      showSnackbar("Prices updated");
      navigate("/products");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errorDetail?: string } } };
      showSnackbar(error.response?.data?.errorDetail || "Failed to adjust prices", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const hasSelection = selectAll || selectedIds.size > 0;
  const hasAction = sellingPriceAction !== "NO_CHANGE" || costPriceAction !== "NO_CHANGE";

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Tooltip title="Back to more options" arrow>
          <IconButton onClick={() => navigate("/more")}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" fontWeight={600}>Quick Price Adjust</Typography>
      </div>

      <div className={style.content}>
        <Tooltip title="Apply price changes to all products in your store" arrow>
          <FormControlLabel
            control={<Checkbox checked={selectAll} onChange={(e) => setSelectAll(e.target.checked)} />}
            label="Select All Products"
          />
        </Tooltip>

        {!selectAll && (
          <div className={style.productList}>
            {products.map((p) => (
              <Card key={p.id} onClick={() => toggleSelect(p.id)} sx={{ "&&": { overflow: "visible" }, cursor: "pointer", borderRadius: 2, mb: 0.5 }}>
                <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 }, display: "flex", alignItems: "center", gap: 1 }}>
                  <Checkbox checked={selectedIds.has(p.id)} size="small" />
                  <div style={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>{p.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Sell: P{p.sellingPrice.toFixed(2)} | Cost: P{p.costPrice.toFixed(2)}
                    </Typography>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Divider sx={{ my: 2 }} />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <FormLabel sx={{ mb: 0.5, fontWeight: 600 }}>Selling Price</FormLabel>
          <RadioGroup value={sellingPriceAction} onChange={(e) => setSellingPriceAction(e.target.value)}>
            <FormControlLabel value="NO_CHANGE" control={<Radio size="small" />} label="No Change" />
            <FormControlLabel value="INCREASE_BY" control={<Radio size="small" />} label="Increase By" />
            <FormControlLabel value="DECREASE_BY" control={<Radio size="small" />} label="Decrease By" />
            <FormControlLabel value="SET_TO" control={<Radio size="small" />} label="Set To" />
          </RadioGroup>
          {sellingPriceAction !== "NO_CHANGE" && (
            <TextField
              size="small"
              type="number"
              label="Amount (PHP)"
              value={sellingPriceAmount}
              onChange={(e) => setSellingPriceAmount(e.target.value)}
              inputProps={{ inputMode: "decimal", min: 0, step: "any" }}
              onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
              fullWidth
              sx={{ mt: 1 }}
            />
          )}
        </FormControl>

        <FormControl fullWidth>
          <FormLabel sx={{ mb: 0.5, fontWeight: 600 }}>Cost Price</FormLabel>
          <RadioGroup value={costPriceAction} onChange={(e) => setCostPriceAction(e.target.value)}>
            <FormControlLabel value="NO_CHANGE" control={<Radio size="small" />} label="No Change" />
            <FormControlLabel value="INCREASE_BY" control={<Radio size="small" />} label="Increase By" />
            <FormControlLabel value="DECREASE_BY" control={<Radio size="small" />} label="Decrease By" />
            <FormControlLabel value="SET_TO" control={<Radio size="small" />} label="Set To" />
          </RadioGroup>
          {costPriceAction !== "NO_CHANGE" && (
            <TextField
              size="small"
              type="number"
              label="Amount (PHP)"
              value={costPriceAmount}
              onChange={(e) => setCostPriceAmount(e.target.value)}
              inputProps={{ inputMode: "decimal", min: 0, step: "any" }}
              onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
              fullWidth
              sx={{ mt: 1 }}
            />
          )}
        </FormControl>

        <Tooltip title="Apply the selected price changes" arrow>
          <span>
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
              onClick={handleApply}
              disabled={!hasSelection || !hasAction || isLoading}
            >
              {isLoading ? "Applying..." : "Apply Price Changes"}
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default QuickPriceAdjustPage;
