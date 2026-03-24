import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux-toolkit/store";
import { incrementItem, decrementItem, setItemQuantity, removeFromCart, clearCart, setCartOpen } from "../sellSlice";
import { triggerReportRefresh } from "../../report/reportSlice";
import { triggerProductRefresh } from "../../product/productSlice";
import { createSale } from "../sellApiService";
import dayjs from "dayjs";
import {
  Drawer, Typography, IconButton, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Tooltip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteIcon from "@mui/icons-material/Delete";
import { useState } from "react";
import style from "./CartPanel.module.css";

interface CartPanelProps {
  open: boolean;
  onClose: () => void;
  showSnackbar: (msg: string, severity?: "success" | "error") => void;
  onSaleComplete: () => void;
}

const CartPanel: React.FC<CartPanelProps> = ({ open, onClose, showSnackbar, onSaleComplete }) => {
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector((state: RootState) => state.sell.cartItems);
  const cartTotal = useSelector((state: RootState) => state.sell.cartTotal);
  const cartItemCount = useSelector((state: RootState) => state.sell.cartItemCount);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState("");

  const handleCompleteSale = async () => {
    setIsSubmitting(true);
    try {
      await createSale({
        saleDate: dayjs().format("YYYY-MM-DD"),
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      });
      dispatch(clearCart());
      dispatch(setCartOpen(false));
      dispatch(triggerReportRefresh());
      dispatch(triggerProductRefresh());
      onSaleComplete();
      showSnackbar("Sale completed!");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errorDetail?: string } } };
      showSnackbar(error.response?.data?.errorDetail || "Failed to complete sale", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (productId: number, currentQty: number) => {
    setEditingId(productId);
    setEditQty(String(currentQty));
  };

  const commitEdit = (productId: number, availableStock: number) => {
    const parsed = parseInt(editQty);
    if (!isNaN(parsed) && parsed >= 1) {
      dispatch(setItemQuantity({ productId, quantity: Math.min(parsed, availableStock) }));
    }
    setEditingId(null);
    setEditQty("");
  };

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { maxHeight: "85vh", borderTopLeftRadius: 16, borderTopRightRadius: 16, maxWidth: 480, margin: "0 auto" } }}
      >
        <div className={style.header}>
          <Typography variant="h6" fontWeight={600}>Cart ({cartItemCount} items)</Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </div>
        <Divider />

        <div className={style.items}>
          {cartItems.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>Cart is empty</Typography>
          ) : (
            cartItems.map((item) => (
              <div key={item.productId} className={style.cartItem}>
                <div className={style.itemInfo}>
                  <Typography variant="body1" fontWeight={500}>{item.productName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    P{item.sellingPrice.toFixed(2)} x {item.quantity} = P{item.subtotal.toFixed(2)}
                  </Typography>
                  <Tooltip title="Total stock in your inventory" arrow>
                    <Typography variant="caption" color="text.secondary">
                      Available: {item.availableStock}
                    </Typography>
                  </Tooltip>
                </div>
                <div className={style.itemActions}>
                  <Tooltip title="Decrease quantity" arrow>
                    <IconButton size="small" onClick={() => dispatch(decrementItem(item.productId))}>
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {editingId === item.productId ? (
                    <TextField
                      size="small"
                      type="number"
                      value={editQty}
                      onChange={(e) => setEditQty(e.target.value)}
                      onBlur={() => commitEdit(item.productId, item.availableStock)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEdit(item.productId, item.availableStock);
                        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
                      }}
                      inputProps={{ inputMode: "numeric", min: 1, style: { textAlign: "center", width: 40, padding: "4px 0" } }}
                      autoFocus
                      sx={{ mx: 0.5, width: 56 }}
                    />
                  ) : (
                    <Tooltip title="Tap to type quantity directly" arrow>
                      <Typography
                        variant="body1"
                        fontWeight={600}
                        onClick={() => startEditing(item.productId, item.quantity)}
                        sx={{
                          mx: 1,
                          cursor: "pointer",
                          minWidth: 28,
                          textAlign: "center",
                          borderBottom: "1px dashed #999",
                          userSelect: "none",
                        }}
                      >
                        {item.quantity}
                      </Typography>
                    </Tooltip>
                  )}
                  <Tooltip title="Increase quantity" arrow>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => dispatch(incrementItem(item.productId))}
                        disabled={item.quantity >= item.availableStock}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Remove from cart" arrow>
                    <IconButton size="small" color="error" onClick={() => dispatch(removeFromCart(item.productId))}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={style.footer}>
            <Divider />
            <div className={style.total}>
              <Typography variant="h6" fontWeight={700}>Total</Typography>
              <Typography variant="h6" fontWeight={700} color="primary">P{cartTotal.toFixed(2)}</Typography>
            </div>
            <Tooltip title="Finalize sale and deduct inventory" arrow>
              <span>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleCompleteSale}
                  disabled={isSubmitting}
                  sx={{ mb: 1, py: 1.2, borderRadius: 2 }}
                >
                  {isSubmitting ? "Processing..." : "Complete Sale"}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title="Remove all items from cart" arrow>
              <Button
                variant="outlined"
                fullWidth
                color="error"
                onClick={() => setClearConfirm(true)}
                sx={{ borderRadius: 2 }}
              >
                Clear Cart
              </Button>
            </Tooltip>
          </div>
        )}
      </Drawer>

      <Dialog open={clearConfirm} onClose={() => setClearConfirm(false)}>
        <DialogTitle>Clear Cart?</DialogTitle>
        <DialogContent>
          <Typography>Remove all items from the cart?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearConfirm(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              dispatch(clearCart());
              setClearConfirm(false);
            }}
          >
            Clear
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CartPanel;
