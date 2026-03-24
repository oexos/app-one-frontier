import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Typography, Card, CardContent, IconButton, Tooltip } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { getDailySummary, DailySummary } from "../reportApiService";
import dayjs from "dayjs";
import style from "./DailySummaryPage.module.css";

const DailySummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(dayjs());
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const minDate = dayjs().subtract(30, "day");
  const isToday = date.isSame(dayjs(), "day");
  const isAtLimit = date.isSame(minDate, "day") || date.isBefore(minDate, "day");

  useEffect(() => {
    setIsLoading(true);
    getDailySummary(date.format("YYYY-MM-DD"))
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [date]);

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Tooltip title="Back to reports" arrow>
          <IconButton onClick={() => navigate("/reports")}>
            <ArrowBackIcon />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" fontWeight={600}>Daily Summary</Typography>
      </div>

      <div className={style.dateNav}>
        <Tooltip title="Previous day" arrow>
          <span>
            <IconButton onClick={() => setDate(date.subtract(1, "day"))} disabled={isAtLimit}>
              <ChevronLeftIcon />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="body1" fontWeight={500}>
          {date.format("ddd, MMM D, YYYY")}
          {isToday && " (Today)"}
        </Typography>
        <Tooltip title={isToday ? "Already showing today" : "Next day"} arrow>
          <span>
            <IconButton onClick={() => setDate(date.add(1, "day"))} disabled={isToday}>
              <ChevronRightIcon />
            </IconButton>
          </span>
        </Tooltip>
      </div>

      {isLoading ? (
        <Typography sx={{ textAlign: "center", py: 4 }}>Loading...</Typography>
      ) : summary ? (
        <div className={style.cards}>
          <Card>
            <CardContent>
              <Tooltip title="Total amount from completed sales (excludes voided)" arrow>
                <Typography variant="body2" color="text.secondary">Revenue</Typography>
              </Tooltip>
              <Typography variant="h5" fontWeight={700} color="primary">P{summary.revenue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
          <div className={style.row}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Tooltip title="Revenue minus cost of goods sold" arrow>
                  <Typography variant="caption" color="text.secondary">Product Profit</Typography>
                </Tooltip>
                <Typography variant="h6" fontWeight={600}>P{summary.productProfit.toFixed(2)}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Tooltip title="Total expenses logged for this date" arrow>
                  <Typography variant="caption" color="text.secondary">Expenses</Typography>
                </Tooltip>
                <Typography variant="h6" fontWeight={600} color="error">-P{summary.totalExpenses.toFixed(2)}</Typography>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent>
              <Tooltip title="Product profit minus total expenses" arrow>
                <Typography variant="body2" color="text.secondary">Actual Profit</Typography>
              </Tooltip>
              <Typography variant="h5" fontWeight={700} color={summary.actualProfit >= 0 ? "success.main" : "error"}>
                P{summary.actualProfit.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <div className={style.row}>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Tooltip title="Number of completed sales (excludes voided)" arrow>
                  <Typography variant="caption" color="text.secondary">Transactions</Typography>
                </Tooltip>
                <Typography variant="h6" fontWeight={600}>{summary.transactionCount}</Typography>
              </CardContent>
            </Card>
            <Card sx={{ flex: 1 }}>
              <CardContent>
                <Tooltip title="Total quantity of individual items sold" arrow>
                  <Typography variant="caption" color="text.secondary">Items Sold</Typography>
                </Tooltip>
                <Typography variant="h6" fontWeight={600}>{summary.itemsSold}</Typography>
              </CardContent>
            </Card>
          </div>

          {summary.topSellers.length > 0 && (
            <Card>
              <CardContent>
                <Tooltip title="Products ranked by quantity sold" arrow>
                  <Typography variant="body1" fontWeight={600} gutterBottom>Top by Quantity</Typography>
                </Tooltip>
                {summary.topSellers.map((ts, i) => (
                  <div key={ts.productName} className={style.topSeller}>
                    <Typography variant="body2">{i + 1}. {ts.productName}</Typography>
                    <Typography variant="body2" fontWeight={600}>{ts.quantitySold} sold</Typography>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {summary.topByRevenue && summary.topByRevenue.length > 0 && (
            <Card>
              <CardContent>
                <Tooltip title="Products ranked by total sales revenue" arrow>
                  <Typography variant="body1" fontWeight={600} gutterBottom>Top by Revenue</Typography>
                </Tooltip>
                {summary.topByRevenue.map((ts, i) => (
                  <div key={ts.productName} className={style.topSeller}>
                    <Typography variant="body2">{i + 1}. {ts.productName}</Typography>
                    <Typography variant="body2" fontWeight={600}>P{ts.totalRevenue?.toFixed(2)}</Typography>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Typography sx={{ textAlign: "center", py: 4 }} color="text.secondary">No data for this date</Typography>
      )}
    </div>
  );
};

export default DailySummaryPage;
