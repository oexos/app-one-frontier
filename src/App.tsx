import { MsalProvider } from "@azure/msal-react";
import { BrowserRouter, Route, Routes } from "react-router";
import { Provider } from "react-redux";
import HomePage from "./components/pages/home/HomePage";
import PageNotFoundPage from "./components/pages/pageNotFound/PageNotFoundPage";
import StoreSetupPage from "./components/pages/storeSetup/StoreSetupPage";
import AuthenticatedLayout from "./components/layout/AuthenticatedLayout";
import SellPage from "./components/pages/sell/SellPage";
import ProductPage from "./components/pages/product/ProductPage";
import AddEditProductPage from "./components/pages/product/addEditProduct/AddEditProductPage";
import CategoryPage from "./components/pages/product/categoryManagement/CategoryPage";
import ReportHubPage from "./components/pages/report/ReportHubPage";
import DailySummaryPage from "./components/pages/report/dailySummary/DailySummaryPage";
import InventoryPage from "./components/pages/report/inventory/InventoryPage";
import SalesHistoryPage from "./components/pages/report/salesHistory/SalesHistoryPage";
import ExpensePage from "./components/pages/expense/ExpensePage";
import MorePage from "./components/pages/more/MorePage";
import QuickPriceAdjustPage from "./components/pages/more/quickPriceAdjust/QuickPriceAdjustPage";
import AccountSettingsPage from "./components/pages/more/accountSettings/AccountSettingsPage";
import { store } from "./redux-toolkit/store";
import { msalInstance } from "./security-oauth2/azureMsal";

const App: React.FC = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/store-setup" element={<StoreSetupPage />} />
            <Route element={<AuthenticatedLayout />}>
              <Route path="/sell" element={<SellPage />} />
              <Route path="/products" element={<ProductPage />} />
              <Route path="/products/add" element={<AddEditProductPage />} />
              <Route path="/products/:id/edit" element={<AddEditProductPage />} />
              <Route path="/categories" element={<CategoryPage />} />
              <Route path="/reports" element={<ReportHubPage />} />
              <Route path="/reports/daily-summary" element={<DailySummaryPage />} />
              <Route path="/reports/inventory" element={<InventoryPage />} />
              <Route path="/reports/sales-history" element={<SalesHistoryPage />} />
              <Route path="/expenses" element={<ExpensePage />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/more/quick-price-adjust" element={<QuickPriceAdjustPage />} />
              <Route path="/more/account-settings" element={<AccountSettingsPage />} />
            </Route>
            <Route path="*" element={<PageNotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </MsalProvider>
  );
};

export default App;
