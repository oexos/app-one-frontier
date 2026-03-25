import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux-toolkit/store";
import { triggerExpenseRefresh } from "./expenseSlice";
import { triggerReportRefresh } from "../report/reportSlice";
import { searchExpenses, createExpense, updateExpense, deleteExpense, ExpenseResponse } from "./expenseApiService";
import dayjs from "dayjs";
import {
  Typography, Card, CardContent, Fab, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import InfiniteScrollList from "../../shared/InfiniteScrollList";
import { LayoutContext } from "../../layout/AuthenticatedLayout";
import style from "./ExpensePage.module.css";

const ExpensePage: React.FC = () => {
  const { showSnackbar } = useOutletContext<LayoutContext>();
  const dispatch = useDispatch<AppDispatch>();
  const refreshTrigger = useSelector((state: RootState) => state.expense.refreshTrigger);

  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [page, setPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadExpenses = useCallback(async (pageNum: number, append: boolean) => {
    setIsLoading(true);
    try {
      const res = await searchExpenses({ page: pageNum, size: 20 });
      if (append) {
        setExpenses((prev) => [...prev, ...res.data.content]);
      } else {
        setExpenses(res.data.content);
      }
      setHasNext(res.data.hasNext);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    loadExpenses(0, false);
  }, [loadExpenses, refreshTrigger]);

  const fetchNextPage = () => {
    const next = page + 1;
    setPage(next);
    loadExpenses(next, true);
  };

  const openAddDialog = () => {
    setEditingExpense(null);
    setDescription("");
    setAmount("");
    setExpenseDate(dayjs().format("YYYY-MM-DD"));
    setDialogOpen(true);
  };

  const openEditDialog = (expense: ExpenseResponse) => {
    setEditingExpense(expense);
    setDescription(expense.description);
    setAmount(String(expense.amount));
    setExpenseDate(expense.expenseDate);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!description.trim() || !amount) return;
    try {
      const data = { description: description.trim(), amount: parseFloat(amount), expenseDate };
      if (editingExpense) {
        await updateExpense(editingExpense.id, data);
        showSnackbar("Expense updated");
      } else {
        await createExpense(data);
        showSnackbar("Expense added");
      }
      dispatch(triggerExpenseRefresh());
      dispatch(triggerReportRefresh());
      setDialogOpen(false);
      setPage(0);
      loadExpenses(0, false);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to save expense", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteExpense(id);
      dispatch(triggerExpenseRefresh());
      dispatch(triggerReportRefresh());
      showSnackbar("Expense deleted");
      setDeleteConfirm(null);
      setPage(0);
      loadExpenses(0, false);
    } catch (err) {
      console.error(err);
      showSnackbar("Failed to delete expense", "error");
    }
  };

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Typography variant="h6" fontWeight={600}>Expenses</Typography>
      </div>

      <InfiniteScrollList fetchNextPage={fetchNextPage} hasNextPage={hasNext} isLoading={isLoading}>
        <div className={style.list}>
          {expenses.map((expense, index) => {
            const currentDate = expense.expenseDate;
            const prevDate = index > 0 ? expenses[index - 1].expenseDate : null;
            const showHeader = currentDate !== prevDate;
            const today = dayjs().format("YYYY-MM-DD");
            const yesterday = dayjs().subtract(1, "day").format("YYYY-MM-DD");
            const dayLabel = currentDate === today ? "Today" : currentDate === yesterday ? "Yesterday" : dayjs(currentDate).format("MMM D, YYYY");
            const dayTotal = showHeader
              ? expenses.filter((e) => e.expenseDate === currentDate).reduce((sum, e) => sum + e.amount, 0)
              : 0;

            return (
              <div key={expense.id}>
                {showHeader && (
                  <div className={style.dayHeader}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary">{dayLabel}</Typography>
                    <Typography variant="body2" fontWeight={600} color="error">-P{dayTotal.toFixed(2)}</Typography>
                  </div>
                )}
                <Card>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 }, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <Typography variant="body1" fontWeight={500}>{expense.description}</Typography>
                      <Typography variant="body2" color="error" fontWeight={600}>-P{expense.amount.toFixed(2)}</Typography>
                    </div>
                    <div>
                      <Tooltip title="Edit this expense" arrow>
                        <IconButton size="small" onClick={() => openEditDialog(expense)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete this expense" arrow>
                        <IconButton size="small" color="error" onClick={() => setDeleteConfirm(expense.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
          {expenses.length === 0 && !isLoading && (
            <Typography color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
              No expenses recorded yet
            </Typography>
          )}
        </div>
      </InfiniteScrollList>

      <Tooltip title="Add a new expense" arrow>
        <Fab onClick={openAddDialog} sx={{ "&&": { position: "fixed", bottom: 72, right: 16, backgroundColor: "#1976d2", color: "#fff" }, zIndex: 99, "&:hover": { backgroundColor: "#1565c0" } }}>
          <AddIcon />
        </Fab>
      </Tooltip>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>{editingExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "24px !important", overflow: "visible" }}>
          <TextField
            label="Description"
            fullWidth
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Electricity, Transportation"
            autoFocus
            sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
          />
          <TextField
            label="Amount"
            type="number"
            fullWidth
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ inputMode: "decimal", min: 0, step: "any" }}
            onKeyDown={(e) => { if (["e", "E", "+", "-"].includes(e.key)) e.preventDefault(); }}
            sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
          />
          <TextField
            label="Date"
            type="date"
            fullWidth
            required
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ "& .MuiFormLabel-asterisk": { color: "red" } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!description.trim() || !amount || parseFloat(amount) <= 0}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Expense?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button color="error" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExpensePage;
