import { MsalProvider } from "@azure/msal-react";
import { BrowserRouter, Route, Routes } from "react-router";

import { Provider } from "react-redux";
import HomePage from "./components/pages/home/HomePage";
import PageNotFoundPage from "./components/pages/pageNotFound/PageNotFoundPage";
import DashboardPage from "./components/pages/dashboard/DashboardPage";
import RegisterPage from "./components/pages/register/RegisterPage";
import ClearanceRequestPage from "./components/pages/clearanceRequest/ClearanceRequestPage";
import ClearanceRequestDetailPage from "./components/pages/clearanceRequest/clearanceRequestDetail/ClearanceRequestDetailPage";
import ComplaintPage from "./components/pages/complaint/ComplaintPage";
import AnnouncementPage from "./components/pages/announcement/AnnouncementPage";
import VerifyPage from "./components/pages/verify/VerifyPage";
import { store } from "./redux-toolkit/store";
import { msalInstance } from "./security-oauth2/azureMsal";

const App: React.FC = () => {
  return (
    <MsalProvider instance={msalInstance}>
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/clearance-requests" element={<ClearanceRequestPage />} />
            <Route path="/clearance-requests/:id" element={<ClearanceRequestDetailPage />} />
            <Route path="/complaints" element={<ComplaintPage />} />
            <Route path="/announcements" element={<AnnouncementPage />} />
            <Route path="/verify/:clearanceNumber" element={<VerifyPage />} />
            <Route path="*" element={<PageNotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </MsalProvider>
  );
};

export default App;
