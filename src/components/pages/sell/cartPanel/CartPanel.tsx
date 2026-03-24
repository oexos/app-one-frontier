import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux-toolkit/store";
import { incrementItem, decrementItem, removeFromCart, clearCart, setCartOpen } from "../sellSlice";
import { triggerReportRefresh } from "../../report/reportSlice";
import { triggerProductRefresh } from "../../product/productSlice";
import { createSale } from "../sellApiService";
import dayjs from "dayjs";
import {
  Drawer, Typography, IconButton, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions,
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
                </div>
                <div className={style.itemActions}>
                  <IconButton size="small" onClick={() => dispatch(decrementItem(item.productId))}>
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body1" fontWeight={600} sx={{ mx: 1 }}>{item.quantity}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => dispatch(incrementItem(item.productId))}
                    disabled={item.quantity >= item.availableStock}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => dispatch(removeFromCart(item.productId))}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
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
            <Button
              variant="outlined"
              fullWidth
              color="error"
              onClick={() => setClearConfirm(true)}
              sx={{ borderRadius: 2 }}
            >
              Clear Cart
            </Button>
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
