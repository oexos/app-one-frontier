import { PublicClientApplication } from "@azure/msal-browser";
import { msalConfig } from "./authConfig";

//https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md#sign-a-user-in-using-the-login-apis-provided-by-azuremsal-browser
//https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
//https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-single-page-app-react-prepare-app?tabs=external-tenant

export const msalInstance = new PublicClientApplication(msalConfig);

export const acquireAccessToken = async () => {
  const activeAccount = msalInstance.getActiveAccount();
  const accounts = msalInstance.getAllAccounts();

  if (!activeAccount && accounts.length === 0) {
    throw "User is not logged in!";
  }

  const request = {
    scopes: [import.meta.env.VITE_OAUTH_SCOPE], //api gateway scope
    account: activeAccount || accounts[0],
  };

  const authResult = await msalInstance.acquireTokenSilent(request);

  return authResult.accessToken;
};
