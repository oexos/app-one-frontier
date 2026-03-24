import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux-toolkit/store";
import { addToCart, setCartOpen, CartItem } from "./sellSlice";
import { searchProducts, getCategories, ProductResponse, CategoryResponse } from "../product/productApiService";
import { Card, CardContent, Typography, TextField, InputAdornment, Chip, Badge, Snackbar, Alert, Tooltip } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import Button from "@mui/material/Button";
import InfiniteScrollList from "../../shared/InfiniteScrollList";
import CartPanel from "./cartPanel/CartPanel";
import { LayoutContext } from "../../layout/AuthenticatedLayout";
import style from "./SellPage.module.css";

const SellPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const cartItems = useSelector((state: RootState) => state.sell.cartItems);
  const cartItemCount = useSelector((state: RootState) => state.sell.cartItemCount);
  const cartTotal = useSelector((state: RootState) => state.sell.cartTotal);
  const isCartOpen = useSelector((state: RootState) => state.sell.isCartOpen);

  const getDisplayStock = (product: ProductResponse): number => {
    const inCart = cartItems.find((c: CartItem) => c.productId === product.id);
    return product.quantity - (inCart?.quantity || 0);
  };

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasAnyProducts, setHasAnyProducts] = useState(false);
  const [stockWarning, setStockWarning] = useState("");

  const loadProducts = useCallback(async (pageNum: number, append: boolean) => {
    setIsLoading(true);
    try {
      const res = await searchProducts({
        page: pageNum,
        size: 20,
        search: search || undefined,
        categoryId: selectedCategory && selectedCategory > 0 ? selectedCategory : undefined,
        favoritesOnly: selectedCategory === -1,
      });
      if (append) {
        setProducts((prev) => [...prev, ...res.data.content]);
      } else {
        setProducts(res.data.content);
      }
      setHasNext(res.data.hasNext);
      setTotalProducts(res.data.totalElements);
      if (res.data.totalElements > 0) setHasAnyProducts(true);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    setPage(0);
    loadProducts(0, false);
  }, [loadProducts]);

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => console.error("Failed to load categories", err));
  }, []);

  const fetchNextPage = () => {
    const next = page + 1;
    setPage(next);
    loadProducts(next, true);
  };

  const handleAddToCart = (product: ProductResponse) => {
    if (product.quantity <= 0) {
      setStockWarning(`${product.name} is out of stock. Update stock to make a sale.`);
      return;
    }
    dispatch(addToCart({
      productId: product.id,
      productName: product.name,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      availableStock: product.quantity,
    }));
  };

  if (!hasAnyProducts && !isLoading && !search && selectedCategory === null) {
    return (
      <div className={style.emptyState}>
        <Typography variant="h6" gutterBottom>No products yet!</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Add your first product to start selling.
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
          onClick={() => navigate("/products/add")}
        >
          Add Product
        </Button>
      </div>
    );
  }

  return (
    <div className={style.container}>
      <div className={style.stickyHeader}>
        <div className={style.header}>
          <Typography variant="h6" fontWeight={600}>Sell</Typography>
        </div>

        {(hasAnyProducts || search) && (
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
        )}

        {categories.length > 0 && (
          <div className={style.categoryTabs}>
          <Tooltip title="Show all products" arrow>
            <Chip
              label="All"
              onClick={() => setSelectedCategory(null)}
              size="small"
              sx={{
                "&&": {
                  backgroundColor: selectedCategory === null ? "#1976d2" : "#e0e0e0",
                  color: selectedCategory === null ? "#fff" : "#333",
                },
                fontWeight: selectedCategory === null ? 600 : 400,
              }}
            />
          </Tooltip>
          <Tooltip title="Show products marked as favorite" arrow>
            <Chip
              label="Favorites"
              onClick={() => setSelectedCategory(-1)}
              size="small"
              sx={{
                "&&": {
                  backgroundColor: selectedCategory === -1 ? "#1976d2" : "#e0e0e0",
                  color: selectedCategory === -1 ? "#fff" : "#333",
                },
                fontWeight: selectedCategory === -1 ? 600 : 400,
              }}
            />
          </Tooltip>
          {categories.map((cat) => (
            <Tooltip key={cat.id} title="Filter by this category" arrow>
              <Chip
                label={cat.name}
                onClick={() => setSelectedCategory(cat.id)}
                size="small"
                sx={{
                  "&&": {
                    backgroundColor: selectedCategory === cat.id ? "#1976d2" : "#e0e0e0",
                    color: selectedCategory === cat.id ? "#fff" : "#333",
                  },
                  fontWeight: selectedCategory === cat.id ? 600 : 400,
                }}
              />
            </Tooltip>
          ))}
        </div>
      )}
      </div>

      <InfiniteScrollList fetchNextPage={fetchNextPage} hasNextPage={hasNext} isLoading={isLoading}>
        <div className={style.productGrid}>
          {products.map((product) => {
            const displayStock = getDisplayStock(product);
            const inCart = cartItems.find((c: CartItem) => c.productId === product.id);
            return (
              <Card
                key={product.id}
                className={`${style.productCard} ${displayStock <= 0 ? style.outOfStock : ""}`}
                onClick={() => handleAddToCart(product)}
                sx={{ cursor: "pointer" }}
              >
                <CardContent sx={{ p: 1, "&:last-child": { pb: 1 }, overflow: "hidden" }}>
                  <Typography variant="caption" fontWeight={600} noWrap display="block" sx={{ lineHeight: 1.3 }}>
                    {product.name}
                  </Typography>
                  <Typography color="primary" fontWeight={700} noWrap sx={{ fontSize: product.sellingPrice >= 1000 ? "0.85rem" : "1.05rem" }}>
                    P{product.sellingPrice % 1 === 0 ? product.sellingPrice.toFixed(0) : product.sellingPrice.toFixed(2)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={displayStock <= (product.lowStockThreshold ?? 5) ? "error" : "text.secondary"}
                    sx={{ fontSize: "0.65rem" }}
                  >
                    Stock: {displayStock}{inCart ? ` (${inCart.quantity} in cart)` : ""}
                  </Typography>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </InfiniteScrollList>

      {cartItemCount > 0 && (
        <Tooltip title="Tap to view and manage your cart" arrow>
          <div className={style.cartBar} onClick={() => dispatch(setCartOpen(true))}>
            <Badge badgeContent={cartItemCount} color="secondary">
              <Typography variant="body1" fontWeight={600} color="white">
                View Cart
              </Typography>
            </Badge>
            <Typography variant="body1" fontWeight={700} color="white">
              P{cartTotal.toFixed(2)}
            </Typography>
          </div>
        </Tooltip>
      )}

      <CartPanel
        open={isCartOpen}
        onClose={() => dispatch(setCartOpen(false))}
        showSnackbar={showSnackbar}
        onSaleComplete={() => {
          setPage(0);
          loadProducts(0, false);
        }}
      />

      <Snackbar
        open={Boolean(stockWarning)}
        autoHideDuration={3000}
        onClose={() => setStockWarning("")}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setStockWarning("")} variant="filled">
          {stockWarning}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SellPage;
