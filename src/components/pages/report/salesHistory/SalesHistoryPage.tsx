import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../../redux-toolkit/store";
import { triggerReportRefresh } from "../reportSlice";
import { triggerProductRefresh } from "../../product/productSlice";
import { searchSales, voidSale, SaleResponse } from "../../sell/sellApiService";
import {
  Typography, Card, CardContent, IconButton, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfiniteScrollList from "../../../shared/InfiniteScrollList";
import { LayoutContext } from "../../../layout/AuthenticatedLayout";
import dayjs from "dayjs";
import style from "./SalesHistoryPage.module.css";

interface SalesSearchResult {
  content: SaleResponse[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
}

const SalesHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const [date, setDate] = useState(dayjs());
  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voidConfirm, setVoidConfirm] = useState<SaleResponse | null>(null);

  const minDate = dayjs().subtract(30, "day");
  const isToday = date.isSame(dayjs(), "day");
  const isAtLimit = date.isSame(minDate, "day") || date.isBefore(minDate, "day");

  const loadSales = useCallback(async (pageNum: number, append: boolean) => {
    setIsLoading(true);
    try {
      const res = await searchSales({ page: pageNum, size: 20, date: date.format("YYYY-MM-DD") });
      const data = res.data as SalesSearchResult;
      if (append) {
        setSales((prev) => [...prev, ...data.content]);
      } else {
        setSales(data.content);
      }
      setHasNext(data.hasNext);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [date]);

  useEffect(() => {
    setPage(0);
    loadSales(0, false);
  }, [loadSales]);

  const fetchNextPage = () => {
    const next = page + 1;
    setPage(next);
    loadSales(next, true);
  };

  const handleVoid = async (sale: SaleResponse) => {
    try {
      await voidSale(sale.id, dayjs().format("YYYY-MM-DD"));
      showSnackbar("Sale voided");
      dispatch(triggerReportRefresh());
      dispatch(triggerProductRefresh());
      setVoidConfirm(null);
      setPage(0);
      loadSales(0, false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { errorDetail?: string } } };
      showSnackbar(error.response?.data?.errorDetail || "Failed to void sale", "error");
      setVoidConfirm(null);
    }
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <IconButton onClick={() => navigate("/reports")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight={600}>Sales History</Typography>
      </div>

      <div className={style.dateNav}>
        <IconButton onClick={() => setDate(date.subtract(1, "day"))} disabled={isAtLimit}>
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="body1" fontWeight={500}>
          {date.format("ddd, MMM D, YYYY")} {isToday && "(Today)"}
        </Typography>
        <IconButton onClick={() => setDate(date.add(1, "day"))} disabled={isToday}>
          <ChevronRightIcon />
        </IconButton>
      </div>

      <InfiniteScrollList fetchNextPage={fetchNextPage} hasNextPage={hasNext} isLoading={isLoading}>
        <div className={style.list}>
          {sales.map((sale) => (
            <Card key={sale.id}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <div className={style.saleHeader}>
                  <Typography variant="body1" fontWeight={600}>Sale #{sale.saleNumber}</Typography>
                  <Chip
                    label={sale.status}
                    color={sale.status === "COMPLETED" ? "success" : "error"}
                    size="small"
                  />
                </div>
                <Typography variant="body2" color="text.secondary">
                  {dayjs(sale.createdAt).format("h:mm A")} | {sale.totalItems} items
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary">
                  P{sale.totalAmount.toFixed(2)}
                </Typography>
                {sale.items && sale.items.map((item) => (
                  <Typography key={item.id} variant="caption" display="block" color="text.secondary">
                    {item.productName} x{item.quantity} = P{item.subtotal.toFixed(2)}
                  </Typography>
                ))}
                {sale.status === "COMPLETED" && isToday && (
                  <Button
                    color="error"
                    size="small"
                    sx={{ mt: 1 }}
                    onClick={() => setVoidConfirm(sale)}
                  >
                    Void Sale
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {sales.length === 0 && !isLoading && (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No sales for this date
            </Typography>
          )}
        </div>
      </InfiniteScrollList>

      <Dialog open={voidConfirm !== null} onClose={() => setVoidConfirm(null)}>
        <DialogTitle>Void Sale #{voidConfirm?.saleNumber}?</DialogTitle>
        <DialogContent>
          <Typography>This will restore inventory and mark the sale as voided. This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVoidConfirm(null)}>Cancel</Button>
          <Button color="error" onClick={() => voidConfirm && handleVoid(voidConfirm)}>Void Sale</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SalesHistoryPage;
