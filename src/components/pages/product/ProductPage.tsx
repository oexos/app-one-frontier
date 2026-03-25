import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { useSelector } from "react-redux";
import { RootState } from "../../../redux-toolkit/store";
import { searchProducts, getCategories, ProductResponse, CategoryResponse } from "./productApiService";
import { Card, CardContent, Typography, TextField, InputAdornment, Chip, IconButton, Fab, Tooltip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import InfiniteScrollList from "../../shared/InfiniteScrollList";
import { LayoutContext } from "../../layout/AuthenticatedLayout";
import style from "./ProductPage.module.css";

const ProductPage: React.FC = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const refreshTrigger = useSelector((state: RootState) => state.product.refreshTrigger);

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadProducts = useCallback(async (pageNum: number, append: boolean) => {
    setIsLoading(true);
    try {
      const res = await searchProducts({
        page: pageNum,
        size: 20,
        search: search || undefined,
        categoryId: selectedCategory && selectedCategory > 0 ? selectedCategory : undefined,
      });
      if (append) {
        setProducts((prev) => [...prev, ...res.data.content]);
      } else {
        setProducts(res.data.content);
      }
      setHasNext(res.data.hasNext);
    } catch (err) {
      console.error("Failed to load products", err);
      showSnackbar("Failed to load products", "error");
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, showSnackbar]);

  useEffect(() => {
    setPage(0);
    loadProducts(0, false);
  }, [loadProducts, refreshTrigger]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to load categories", err));
  }, [refreshTrigger]);

  const fetchNextPage = () => {
    const next = page + 1;
    setPage(next);
    loadProducts(next, true);
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Typography variant="h6" fontWeight={600}>Products</Typography>
        <Tooltip title="Manage your product categories" arrow>
          <Chip
            label="Categories"
            onClick={() => navigate("/categories")}
            variant="outlined"
            size="small"
          />
        </Tooltip>
      </div>

      <div className={style.searchBar}>
        <Tooltip title="Search products by name" arrow>
          <TextField
            size="small"
            placeholder="Search products..."
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Tooltip>
      </div>

      {categories.length > 0 && (
        <div className={style.categoryTabs}>
          <Chip
            label="All"
            onClick={() => setSelectedCategory(null)}
            size="small"
            sx={{
              "&&": { backgroundColor: selectedCategory === null ? "#1976d2" : "#e0e0e0", color: selectedCategory === null ? "#fff" : "#333" },
              fontWeight: selectedCategory === null ? 600 : 400,
            }}
          />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={`${cat.name} (${cat.productCount})`}
              onClick={() => setSelectedCategory(cat.id)}
              size="small"
              sx={{
                "&&": { backgroundColor: selectedCategory === cat.id ? "#1976d2" : "#e0e0e0", color: selectedCategory === cat.id ? "#fff" : "#333" },
                fontWeight: selectedCategory === cat.id ? 600 : 400,
              }}
            />
          ))}
        </div>
      )}

      <InfiniteScrollList fetchNextPage={fetchNextPage} hasNextPage={hasNext} isLoading={isLoading}>
        <div className={style.list}>
          {products.map((product) => (
            <Card key={product.id} className={style.productCard}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Typography variant="body1" fontWeight={600}>{product.name}</Typography>
                  <Typography variant="body2" color="primary" fontWeight={600}>
                    P{product.sellingPrice.toFixed(2)}
                  </Typography>
                  <Typography variant="caption" color={product.isLowStock ? "error" : "text.secondary"}>
                    Stock: {product.quantity} {product.isLowStock && "- Low!"}
                  </Typography>
                  {product.categoryName && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      {product.categoryName}
                    </Typography>
                  )}
                </div>
                <Tooltip title="Edit product details" arrow>
                  <IconButton onClick={() => navigate(`/products/${product.id}/edit`)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              </CardContent>
            </Card>
          ))}
          {products.length === 0 && !isLoading && (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No products found
            </Typography>
          )}
        </div>
      </InfiniteScrollList>

      <Tooltip title="Add a new product" arrow>
        <Fab
          onClick={() => navigate("/products/add")}
          sx={{
            "&&": {
              position: "absolute",
              bottom: 72,
              right: 16,
              backgroundColor: "#1976d2",
              color: "#fff",
            },
            zIndex: 99,
            "&:hover": { backgroundColor: "#1565c0" },
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </div>
  );
};

export default ProductPage;
