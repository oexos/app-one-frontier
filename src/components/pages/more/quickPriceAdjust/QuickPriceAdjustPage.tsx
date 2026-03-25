import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import {
  Typography, Card, CardContent, IconButton, Checkbox, Button, TextField,
  Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, Divider, Tooltip, Chip, InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SearchIcon from "@mui/icons-material/Search";
import { searchProducts, bulkPriceAdjust, getCategories, ProductResponse, CategoryResponse, PriceChangePreview, BulkPricePreviewResponse } from "../../product/productApiService";
import InfiniteScrollList from "../../../shared/InfiniteScrollList";
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
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [previews, setPreviews] = useState<PriceChangePreview[] | null>(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [previewPage, setPreviewPage] = useState(0);
  const [previewHasNext, setPreviewHasNext] = useState(false);
  const [isPreviewFetching, setIsPreviewFetching] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const loadProducts = useCallback(async (pageNum: number, append: boolean, search?: string, categoryId?: number | null) => {
    setIsFetching(true);
    try {
      const res = await searchProducts({
        page: pageNum,
        size: 20,
        search: search || undefined,
        categoryId: categoryId ?? undefined,
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
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(0, false);
    getCategories().then((res) => setCategories(res.data)).catch(console.error);
  }, [loadProducts]);

  useEffect(() => {
    setPage(0);
    loadProducts(0, false, searchTerm, selectedCategoryId);
  }, [searchTerm, selectedCategoryId, loadProducts]);

  const fetchNextPage = () => {
    const next = page + 1;
    setPage(next);
    loadProducts(next, true, searchTerm, selectedCategoryId);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildPayload = (preview: boolean) => ({
    productIds: Array.from(selectedIds),
    selectAll,
    categoryId: selectAll ? selectedCategoryId : null,
    search: selectAll ? (searchTerm || null) : null,
    sellingPriceAction,
    sellingPriceAmount: sellingPriceAmount ? parseFloat(sellingPriceAmount) : 0,
    costPriceAction,
    costPriceAmount: costPriceAmount ? parseFloat(costPriceAmount) : 0,
    preview,
  });

  const loadPreviewPage = async (pageNum: number, append: boolean) => {
    setIsPreviewFetching(true);
    try {
      const res = await bulkPriceAdjust({ ...buildPayload(true), page: pageNum, size: 20 });
      const data = res.data as BulkPricePreviewResponse;
      if (append) {
        setPreviews((prev) => [...(prev || []), ...data.content]);
      } else {
        setPreviews(data.content);
      }
      setPreviewTotal(data.totalElements);
      setPreviewHasNext(data.hasNext);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errorDetail?: string } } };
      showSnackbar(error.response?.data?.errorDetail || "Failed to preview", "error");
    } finally {
      setIsPreviewFetching(false);
    }
  };

  const handlePreview = async () => {
    setIsLoading(true);
    setPreviewPage(0);
    await loadPreviewPage(0, false);
    setIsLoading(false);
  };

  const fetchNextPreviewPage = () => {
    const next = previewPage + 1;
    setPreviewPage(next);
    loadPreviewPage(next, true);
  };

  const handleApply = async () => {
    setIsLoading(true);
    try {
      await bulkPriceAdjust(buildPayload(false));
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

  // Preview mode
  if (previews !== null) {
    return (
      <div className={style.container}>
        <div className={style.header}>
          <Tooltip title="Back to adjustment options" arrow>
            <IconButton onClick={() => setPreviews(null)}>
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h6" fontWeight={600}>Preview Changes</Typography>
        </div>

        <div className={style.content}>
          {previews.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No price changes to preview.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {previewTotal} product{previewTotal !== 1 ? "s" : ""} will be updated:
              </Typography>
              <div className={style.previewList}>
                <InfiniteScrollList
                  fetchNextPage={fetchNextPreviewPage}
                  hasNextPage={previewHasNext}
                  isLoading={isPreviewFetching}
                >
                  {previews.map((p) => (
                    <div key={p.productId} className={style.previewItem}>
                      <Typography variant="body2" fontWeight={600}>{p.productName}</Typography>
                      <div className={style.previewPrices}>
                        {p.currentSellingPrice !== p.newSellingPrice && (
                          <Typography variant="caption" display="block">
                            Sell: <span className={style.oldPrice}>P{p.currentSellingPrice.toFixed(2)}</span>
                            {" "}<ArrowForwardIcon sx={{ fontSize: 12, verticalAlign: "middle" }} />{" "}
                            <span className={style.newPrice}>P{p.newSellingPrice.toFixed(2)}</span>
                          </Typography>
                        )}
                        {p.currentCostPrice !== p.newCostPrice && (
                          <Typography variant="caption" display="block">
                            Cost: <span className={style.oldPrice}>P{p.currentCostPrice.toFixed(2)}</span>
                            {" "}<ArrowForwardIcon sx={{ fontSize: 12, verticalAlign: "middle" }} />{" "}
                            <span className={style.newPrice}>P{p.newCostPrice.toFixed(2)}</span>
                          </Typography>
                        )}
                        {p.currentSellingPrice === p.newSellingPrice && p.currentCostPrice === p.newCostPrice && (
                          <Typography variant="caption" color="text.secondary">No changes</Typography>
                        )}
                      </div>
                    </div>
                  ))}
                </InfiniteScrollList>
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setPreviews(null)}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={handleApply}
              disabled={isLoading || previewTotal === 0}
              sx={{ borderRadius: 2 }}
            >
              {isLoading ? "Applying..." : "Confirm & Apply"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

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
          <>
            <TextField
              size="small"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
              sx={{ mb: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
            {categories.length > 0 && (
              <div className={style.categoryChips}>
                <Chip
                  label="All"
                  size="small"
                  color={selectedCategoryId === null ? "primary" : "default"}
                  onClick={() => setSelectedCategoryId(null)}
                />
                {categories.map((cat) => (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    size="small"
                    color={selectedCategoryId === cat.id ? "primary" : "default"}
                    onClick={() => setSelectedCategoryId(selectedCategoryId === cat.id ? null : cat.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!selectAll && (
          <div className={style.productList}>
            <InfiniteScrollList fetchNextPage={fetchNextPage} hasNextPage={hasNext} isLoading={isFetching}>
              {products.map((p) => (
                <Card key={p.id} className={style.productCard} onClick={() => toggleSelect(p.id)} sx={{ "&&": { overflow: "visible" } }}>
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
            </InfiniteScrollList>
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

        <Tooltip title="Preview the price changes before applying" arrow>
          <span>
            <Button
              variant="contained"
              fullWidth
              size="large"
              sx={{ mt: 3, py: 1.2, borderRadius: 2 }}
              onClick={handlePreview}
              disabled={!hasSelection || !hasAction || isLoading}
            >
              {isLoading ? "Loading Preview..." : "Preview Changes"}
            </Button>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default QuickPriceAdjustPage;
