import { useLocation, useNavigate } from "react-router";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import InventoryIcon from "@mui/icons-material/Inventory2";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import Paper from "@mui/material/Paper";

const navItems = [
  { label: "Sell", icon: <PointOfSaleIcon />, path: "/sell" },
  { label: "Products", icon: <InventoryIcon />, path: "/products" },
  { label: "Reports", icon: <AssessmentIcon />, path: "/reports" },
  { label: "Expenses", icon: <ReceiptLongIcon />, path: "/expenses" },
  { label: "More", icon: <MoreHorizIcon />, path: "/more" },
];

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentIndex = navItems.findIndex((item) => location.pathname.startsWith(item.path));

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 480,
        zIndex: 1000,
      }}
      elevation={3}
    >
      <BottomNavigation
        value={currentIndex >= 0 ? currentIndex : 0}
        onChange={(_, newValue) => {
          navigate(navItems[newValue].path);
        }}
        showLabels
      >
        {navItems.map((item) => (
          <BottomNavigationAction key={item.path} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
