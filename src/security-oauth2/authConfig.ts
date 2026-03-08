//https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md#sign-a-user-in-using-the-login-apis-provided-by-azuremsal-browser
//https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-react/docs/getting-started.md
//https://learn.microsoft.com/en-us/entra/identity-platform/tutorial-single-page-app-react-prepare-app?tabs=external-tenant

export const msalConfig = {
  auth: {
    //clientId of the frontend
    clientId: import.meta.env.VITE_OAUTH_CLIENT_ID,
    authority: import.meta.env.VITE_OAUTH_ISSUER_URI,
    redirectUri: "/",
    postLogoutRedirectUri: "/",
    navigateToLoginRequestUrl: false,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
