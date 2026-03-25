# TindahanPOS - Frontend

The simplest POS for every sari-sari store. A mobile-first web application that helps Filipino sari-sari store owners manage their sales, inventory, and expenses with a tap-to-sell interface.

Built for the **SEP Build Hackathon** (March 24-26, 2026).

## Repositories

- **Frontend:** https://bitbucket.org/legalmatch/tindahanposfrontend/src/main/
- **Backend:** https://bitbucket.org/legalmatch/tindahanposbackend/src/main/

## Team

- **Arnel Yutiga**

## Documentation

- **[SystemDesign.md](./SystemDesign.md)** — UI flows, screen layouts, navigation, and business logic for every screen
- **[TechnicalRequirement.md](./TechnicalRequirement.md)** — Database entities, API endpoints, DTOs, frontend/backend structure, implementation sequence, and Azure configuration

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.0 | UI framework |
| TypeScript | 5.8.3 | Type-safe JavaScript |
| Vite | 6.3.5 | Build tool and dev server |
| Material UI (MUI) | 7.2.0 | Component library |
| MUI X DatePickers | 8.9.0 | Date/time picker components |
| Redux Toolkit | 2.8.2 | State management |
| React Router | 7.7.0 | Client-side routing |
| React Hook Form | 7.60.0 | Form handling with validation |
| Axios | 1.10.0 | HTTP client (with Bearer token interceptor) |
| Azure MSAL | 4.13.2 | OAuth2 authentication (Google social login) |
| Day.js | 1.11.13 | Date/time utilities |
| Lodash | 4.17.23 | Utility functions |

## Architecture Overview

```
┌──────────────┐     ┌───────────────────────┐     ┌──────────────────┐
│   Frontend   │────>│  Azure Entra ID       │     │  Local Backend   │
│  (localhost:  │     │  (CIAM)               │     │  (localhost:8080)│
│   5173)      │     │  - Google social login │     │                  │
│              │────>│  - JWT token issuance  │     │                  │
│              │     └───────────────────────┘     │                  │
│              │──────────────────────────────────>│                  │
│              │  API calls with Bearer token      │                  │
└──────────────┘                                   └──────────────────┘
```

**What runs locally:** Frontend dev server, backend API server, SQL Server database (Docker)

**What runs externally (already configured, no setup needed):**
- **Azure Entra ID (CIAM)** — Handles user authentication. When a user clicks "Login", the frontend opens a popup to Azure's login page where they sign in with Google. Azure issues a JWT token that the frontend sends to the backend on every API call. The backend validates this token to authenticate the user.
- **Azure API Gateway (optional)** — Only needed when testing with brand-new users who have never logged in before. The API Gateway auto-assigns new users to the StoreOwner group and exchanges tokens so the backend receives the correct `roles` claim. For local development with existing test accounts, you don't need the API Gateway.

## Prerequisites

Before you begin, make sure you have the following installed:

1. **Git** — https://git-scm.com/downloads
2. **Node.js v18+** (includes npm) — https://nodejs.org/ (download the LTS version)

Verify your installations:

```bash
git --version
node --version    # Should be v18.x or higher
npm --version
```

You also need the **backend service** running before using the app. See the [backend README](../app-one-service-one/README.md) for setup instructions.

> **Internet connection required:** Even when running locally, the app requires internet access because user login goes through Azure Entra ID (cloud-hosted authentication). Without internet, users cannot log in.

## Getting Started

### 1. Clone the repository

```bash
git clone https://bitbucket.org/legalmatch/tindahanposfrontend.git
cd tindahanposfrontend
```

### 2. Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json` (React, MUI, Redux, etc.).

### 3. Configure environment

The `.env` file controls which backend the app connects to and which Azure AD tenant handles authentication.

The repo includes multiple `.env` variants:

| File | Backend Target | When to Use |
|---|---|---|
| `.env` (default) | `http://localhost:8080` | Local development with existing test accounts |
| `.env-call-to-local-backend-service` | `http://localhost:8080` | Same as above (backup copy) |
| `.env-call-via-api-gateway` | `https://arnelyutiga.azure-api.net` | Testing with new users (API Gateway auto-assigns roles) |
| `.env-call-container-app-service-backend` | Azure Container App URL | Testing against the deployed cloud backend |

**For local development, use the default `.env` — no changes needed:**

```bash
# .env — already configured for local development
export VITE_APP_ONE_MICROSERVICE_URL="http://localhost:8080"    # Points to local backend
export VITE_OAUTH_ISSUER_URI="https://arnelyutigapoc.ciamlogin.com/"  # Azure AD tenant (external, already configured)
export VITE_OAUTH_CLIENT_ID="783ed124-3dd9-4efd-beaa-88ca93dd3b2e"    # Azure AD app registration (external, already configured)
export VITE_OAUTH_SCOPE="api://a52b2d35-98fb-4e76-9a54-f369e177add4/.default"  # Backend API scope (external, already configured)
```

**What each variable does:**

| Variable | What It Does | Can You Change It? |
|---|---|---|
| `VITE_APP_ONE_MICROSERVICE_URL` | URL of the backend API the frontend sends requests to | Yes — change to point to a different backend (local or cloud) |
| `VITE_OAUTH_ISSUER_URI` | Azure AD tenant URL that handles login | No — this is a shared Azure tenant managed by the team |
| `VITE_OAUTH_CLIENT_ID` | Identifies this frontend app to Azure AD during login | No — this is registered in Azure and must match |
| `VITE_OAUTH_SCOPE` | Tells Azure AD which API permissions to include in the token | No — must match the backend's app registration in Azure |

> **In short:** The only value you'd typically change is `VITE_APP_ONE_MICROSERVICE_URL` to point to your backend. The other three values are tied to the Azure AD configuration and should not be changed unless you set up your own Azure tenant.

### 4. Start the development server

```bash
npm run dev
```

The app runs on **http://localhost:5173**. Open this URL in your browser.

### 5. Login

1. Make sure the **backend is running** on `http://localhost:8080` (see [backend README](../app-one-service-one/README.md))
2. Open **http://localhost:5173** in your browser
3. Click the **"Login"** button on the home screen
4. A popup will open for Google sign-in via Azure AD
5. Sign in with the test account:
   - Email: `selena.arnel@gmail.com`
   - Password: `Lyks2BFree`
6. After login, you'll be redirected to the Store Setup screen (first time) or the Main Selling Screen

> **Important:** Local backend only works with test accounts that are already assigned to a group in Azure AD (like the test account above). Brand-new users who have never logged in will get 403 errors because their token won't have the `roles` claim. To test with new users, switch the `.env` to use the API Gateway (`.env-call-via-api-gateway`).

## Features

| Feature | Description |
|---|---|
| **Tap-to-Sell** | Mobile-first product grid with tap-to-add-to-cart, category filtering, and search |
| **Cart & Checkout** | Slide-up cart panel with quantity adjustment, stock enforcement, and instant sale completion |
| **Product Catalog** | Full CRUD for products with categories, favorites, and stock tracking |
| **Category Management** | Create, rename, and delete product categories |
| **Daily Sales Summary** | Revenue, profit, top sellers by quantity and revenue, expense breakdown |
| **Inventory Tracking** | Low-stock alerts, restock dialog with optional cost price update |
| **Sales History & Void** | Browse sales by date, void today's sales with inventory restoration |
| **Expense Logger** | Log overhead expenses grouped by day, feeds into profit calculations |
| **Quick Price Adjust** | Bulk price changes for multiple products with preview |
| **Account Settings** | View profile info, edit store name |

## Project Structure

```
src/
├── api-client/               # Axios HTTP client with Bearer token
├── redux-toolkit/            # Redux store configuration
├── security-oauth2/          # MSAL auth config (Azure AD)
├── components/
│   ├── layout/               # AuthenticatedLayout, BottomNav
│   ├── shared/               # InfiniteScrollList (reusable)
│   └── pages/
│       ├── home/             # Login page
│       ├── storeSetup/       # First-time store name setup
│       ├── sell/             # Main selling screen + cart panel
│       ├── product/          # Product management + add/edit + categories
│       ├── report/           # Reports hub, daily summary, inventory, sales history
│       ├── expense/          # Expense logger
│       └── more/             # Quick price adjust, account settings
```

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (http://localhost:5173) |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Troubleshooting

| Problem | Solution |
|---|---|
| `npm install` fails | Make sure you have Node.js v18+ installed. Delete `node_modules` folder and `package-lock.json`, then run `npm install` again. |
| Login popup doesn't appear | Allow popups in your browser for `localhost:5173`. |
| Login popup shows an error | Check your internet connection — login requires reaching Azure AD servers. |
| 403 Forbidden after login | You're using a new account that hasn't been assigned roles. Use the test account (`selena.arnel@gmail.com`) or switch `.env` to use the API Gateway. |
| API calls fail after login | Make sure the backend is running on `http://localhost:8080`. Check `.env` has `VITE_APP_ONE_MICROSERVICE_URL="http://localhost:8080"`. |
| Blank screen after login | Open browser DevTools (F12) > Console to check for errors. |
