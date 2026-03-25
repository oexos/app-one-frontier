import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardContent, Typography, CardActionArea, Tooltip, Skeleton } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InventoryIcon from "@mui/icons-material/Inventory2";
import HistoryIcon from "@mui/icons-material/History";
import { getDailySummary } from "./reportApiService";
import { searchProducts } from "../product/productApiService";
import { searchSales } from "../sell/sellApiService";
import dayjs from "dayjs";
import style from "./ReportHubPage.module.css";

const ReportHubPage: React.FC = () => {
  const navigate = useNavigate();
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null);
  const [todayProfit, setTodayProfit] = useState<number | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number | null>(null);
  const [todaySaleCount, setTodaySaleCount] = useState<number | null>(null);

  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD");
    getDailySummary(today)
      .then((res) => { setTodayRevenue(res.data.revenue); setTodayProfit(res.data.actualProfit); })
      .catch(console.error);
    searchProducts({ lowStockOnly: true, size: 1 })
      .then((res) => setLowStockCount(res.data.totalElements))
      .catch(console.error);
    searchSales({ date: today, size: 1 })
      .then((res) => {
        const data = res.data as { totalElements?: number };
        setTodaySaleCount(data.totalElements ?? 0);
      })
      .catch(console.error);
  }, []);

  return (
    <div className={style.container}>
      <div className={style.header}>
        <Typography variant="h6" fontWeight={600}>Reports</Typography>
      </div>
      <div className={style.cards}>
        <Card>
          <CardActionArea onClick={() => navigate("/reports/daily-summary")}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <AssessmentIcon color="primary" fontSize="large" />
              <div>
                <Typography variant="body1" fontWeight={600}>Daily Sales Summary</Typography>
                {todayRevenue !== null ? (
                  <Typography variant="body2" color="text.secondary">
                    Today: ₱{todayRevenue.toFixed(2)} revenue, ₱{todayProfit?.toFixed(2)} profit
                  </Typography>
                ) : (
                  <Skeleton variant="text" width={200} />
                )}
              </div>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card>
          <CardActionArea onClick={() => navigate("/reports/inventory")}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <InventoryIcon color="warning" fontSize="large" />
              <div>
                <Typography variant="body1" fontWeight={600}>Inventory / Low Stock</Typography>
                {lowStockCount !== null ? (
                  <Tooltip title="Products at or below their stock alert threshold" arrow>
                    <Typography variant="body2" color={lowStockCount > 0 ? "error" : "text.secondary"}>
                      {lowStockCount > 0 ? `${lowStockCount} products low on stock` : "All stock levels OK"}
                    </Typography>
                  </Tooltip>
                ) : (
                  <Skeleton variant="text" width={180} />
                )}
              </div>
            </CardContent>
          </CardActionArea>
        </Card>

        <Card>
          <CardActionArea onClick={() => navigate("/reports/sales-history")}>
            <CardContent sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <HistoryIcon color="info" fontSize="large" />
              <div>
                <Typography variant="body1" fontWeight={600}>Sales History</Typography>
                {todaySaleCount !== null ? (
                  <Tooltip title="Number of sales transactions today" arrow>
                    <Typography variant="body2" color="text.secondary">
                      {todaySaleCount} sales today
                    </Typography>
                  </Tooltip>
                ) : (
                  <Skeleton variant="text" width={120} />
                )}
              </div>
            </CardContent>
          </CardActionArea>
        </Card>
      </div>
    </div>
  );
};

export default ReportHubPage;
