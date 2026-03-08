import { MsalProvider } from "@azure/msal-react";
import { BrowserRouter, Route, Routes } from "react-router";

import { Provider } from "react-redux";
import HomePage from "./components/pages/home/HomePage";
import PageNotFoundPage from "./components/pages/pageNotFound/PageNotFoundPage";
import SessionPage from "./components/pages/session/SessionPage";
import { store } from "./redux-toolkit/store";
import { msalInstance } from "./security-oauth2/azureMsal";

const App: React.FC = () => {
  return (
    //https://reactrouter.com/start/declarative/installation for BrowserRouter,Routes and Route
    //https://redux-toolkit.js.org/tutorials/quick-start for MsalProvider and Provider
    <MsalProvider instance={msalInstance}>
      <Provider store={store}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/session" element={<SessionPage />} />
            <Route path="*" element={<PageNotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </Provider>
    </MsalProvider>
  );
};

export default App;
