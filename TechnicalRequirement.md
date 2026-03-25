# TindahanPOS — Technical Requirements

*Technical specification derived from `tindahanpos.md` (business requirements) and `SystemDesign.md` (UI flows & business logic).*

*March 2026*

---

## Feature Priority Order

Features are numbered by priority — build top-down, stop when time runs out. Numbers match SystemDesign.md features.

| Priority | Feature | Layer | MVP? |
|----------|---------|-------|------|
| P1 | Tap-to-Sell Interface | Data Capture | Yes |
| P2 | Owner-Built Product Catalog | Data Capture | Yes |
| P3 | Void / Correction | Data Capture | Yes |
| P4 | Quick Price Adjust | Data Capture | Yes |
| P5 | Daily Sales Summary | Tracking/Reporting | Yes |
| P6 | Simple Inventory Counter | Tracking/Reporting | Yes |
| P7 | Expense Logger | Tracking/Reporting | Yes |

**Core required flow:** Owner logs in → sets up store → adds products → sells items (tap-to-sell → cart → complete sale) → views daily summary. This is the minimum complete flow that must be finished. P2 (product catalog) must be built before P1 (selling) since selling needs products. Implementation order is adjusted accordingly — see Implementation Sequence.

**Not in MVP:** Utang tracker, PWA offline, supplier order shortcut, e-load/bills, GCash/Maya payment, Tagalog UI, product photos. These are future features documented in `tindahanpos.md`.

---

## Authorization Model

### How it works
- **App Roles** = granular permissions per endpoint. Static in backend code via `@PreAuthorize`. Defined on the backend app registration in Azure.
- **Groups** = collections of app roles. Configured in Azure Entra ID by Arnel. Dynamic — Arnel can add/remove app roles from groups without code changes.
- **Users** = assigned to groups. Unregistered users who log in via social login (e.g., Google) are automatically added to the **StoreOwner** group by the API Gateway.

The backend only cares about app roles in `@PreAuthorize`. It does not know about groups — group-to-app-role mapping is entirely in Azure.

**TindahanPOS is simpler than BarangayConnect:** There is only one user role — every authenticated user is a store owner. There is no admin/official distinction. Every user has access to all features for their own store.

### App Roles (Permissions)

| App Role | Used On | Description |
|----------|---------|-------------|
| `TindahanPOS.Store.Manage` | POST `/stores`, GET `/stores/me`, PATCH `/stores/me` | Create and manage own store |
| `TindahanPOS.Product.Manage` | POST, GET, PATCH, DELETE `/products/**` | Full product CRUD + restock |
| `TindahanPOS.Category.Manage` | POST, GET, PATCH, DELETE `/categories/**` | Full category CRUD |
| `TindahanPOS.Sale.Create` | POST `/sales` | Complete a sale |
| `TindahanPOS.Sale.View` | GET `/sales`, GET `/sales/{id}` | View sales history |
| `TindahanPOS.Sale.Void` | PATCH `/sales/{id}/void` | Void a completed sale |
| `TindahanPOS.Expense.Manage` | POST, GET, PATCH, DELETE `/expenses/**` | Full expense CRUD |
| `TindahanPOS.Report.View` | GET `/reports/**` | View daily summary and reports |

### Groups (configured in Azure by Arnel)

| Group | App Roles Assigned | Description |
|-------|-------------------|-------------|
| StoreOwner | All 8 app roles | Auto-assigned to social login users via API Gateway. Every authenticated user is a store owner. |

**User onboarding flow:**
1. New user signs up via Google → API Gateway auto-adds to StoreOwner group → can access all features
2. User lands on Store Setup screen (first-time only) → enters store name → redirected to Main Selling Screen
3. User adds products → starts selling

**Multi-tenancy:** Each user owns exactly one store. All data (products, categories, sales, expenses) is scoped to the user's store. The backend extracts the owner's email from the JWT `preferred_username` claim, looks up the StoreEntity by `ownerEmail`, and filters all queries by `store.id`. One user cannot see another user's data.

Group-to-app-role assignments and user-to-group assignments are managed in Azure Entra ID. **Claude can perform these Azure configuration steps via Azure CLI** during the hackathon. The API Gateway auto-assigns new social login users to a configurable group — for TindahanPOS, this is set to the **StoreOwner** group. This is an Azure config change on the API Gateway, not a code change.

---

## Database Entities

### StoreEntity
Extends `BaseEntity`. Table: `store`

| Field | Type | Notes |
|-------|------|-------|
| id | Long | `@GeneratedValue(IDENTITY)` |
| storeName | String | `@NotNull @NotBlank` — entered during Store Setup |
| ownerEmail | String | `@Column(unique = true)` — from JWT `preferred_username` |

### CategoryEntity
Extends `BaseEntity`. Table: `category`

| Field | Type | Notes |
|-------|------|-------|
| id | Long | `@GeneratedValue(IDENTITY)` |
| store | StoreEntity | `@ManyToOne @JoinColumn` |
| name | String | `@NotNull @NotBlank` |

### ProductEntity
Extends `BaseEntity`. Table: `product`

| Field | Type | Notes |
|-------|------|-------|
| id | Long | `@GeneratedValue(IDENTITY)` |
| store | StoreEntity | `@ManyToOne @JoinColumn` |
| category | CategoryEntity | `@ManyToOne @JoinColumn`, nullable — uncategorized if null |
| name | String | `@NotNull @NotBlank` |
| sellingPrice | BigDecimal | `@NotNull` — must be > 0 |
| costPrice | BigDecimal | `@NotNull` — must be > 0 |
| quantity | Integer | `@NotNull` — current stock count, must be >= 0 |
| lowStockThreshold | Integer | Default 5 — triggers low stock alert when `quantity <= lowStockThreshold` |
| isFavorite | Boolean | Default false — pinned to Favorites tab |

> **Deleting a product:** Hard-deletes the ProductEntity. SaleItemEntity stores all snapshot data (productName, prices) so past sales records are preserved. SaleItemEntity has a nullable reference to ProductEntity — set to null before deleting.

### SaleEntity
Extends `BaseEntity`. Table: `sale`

| Field | Type | Notes |
|-------|------|-------|
| id | Long | `@GeneratedValue(IDENTITY)` |
| store | StoreEntity | `@ManyToOne @JoinColumn` |
| saleNumber | Integer | Sequential per day per store (Sale #1, #2, #3...) |
| saleDate | LocalDate | Date of the sale (device local date) |
| totalAmount | BigDecimal | Sum of all item subtotals |
| totalProfit | BigDecimal | Sum of all item profits |
| totalItems | Integer | Sum of all item quantities |
| status | SaleStatusEnum | `@Enumerated(STRING)` — COMPLETED or VOIDED |
| voidedAt | ZonedDateTime | Nullable — set when voided |

### SaleItemEntity
Extends `BaseEntity`. Table: `sale_item`

| Field | Type | Notes |
|-------|------|-------|
| id | Long | `@GeneratedValue(IDENTITY)` |
| sale | SaleEntity | `@ManyToOne @JoinColumn` |
| product | ProductEntity | `@ManyToOne @JoinColumn`, nullable — null if product was deleted |
| productName | String | Snapshot of product name at time of sale |
| sellingPriceAtSale | BigDecimal | Snapshot of selling price at time of sale |
| costPriceAtSale | BigDecimal | Snapshot of cost price at time of sale |
| quantity | Integer | Quantity sold |
| subtotal | BigDecimal | `sellingPriceAtSale * quantity` |
| profit | BigDecimal | `(sellingPriceAtSale - costPriceAtSale) * quantity` |

> **Historical price preservation:** SaleItemEntity stores `sellingPriceAtSale` and `costPriceAtSale` as snapshots at the time of sale. Future price changes to the product do NOT affect past sales records.

### ExpenseEntity
Extends `BaseEntity`. Table: `expense`

| Field | Type | Notes |
|-------|------|-------|
| id | Long | `@GeneratedValue(IDENTITY)` |
| store | StoreEntity | `@ManyToOne @JoinColumn` |
| description | String | `@NotNull @NotBlank` — e.g., "Electricity", "Transportation" |
| amount | BigDecimal | `@NotNull` — must be > 0 |
| expenseDate | LocalDate | `@NotNull` — defaults to today on frontend |

---

## Enums Summary

| Enum | Values |
|------|--------|
| SaleStatusEnum | COMPLETED, VOIDED |
| PriceAdjustActionEnum | NO_CHANGE, INCREASE_BY, DECREASE_BY, SET_TO |

---

## API Endpoints

All endpoints prefixed with `/app-one-backend`. All endpoints require authentication (no public endpoints).

### Stores

| Method | Path | @PreAuthorize App Role | Description |
|--------|------|----------------------|-------------|
| POST | `/stores` | `Store.Manage` | Create store (first-time setup) |
| GET | `/stores/me` | `Store.Manage` | Get own store by JWT email |
| PATCH | `/stores/me` | `Store.Manage` | Update store name |

**`GET /stores/me` behavior:**
- Extracts `preferred_username` from JWT → finds StoreEntity by ownerEmail
- Returns 404 if no store exists (triggers Store Setup on frontend)
- Used on every authenticated page load to determine if Store Setup is needed

### Products

| Method | Path | @PreAuthorize App Role | Description |
|--------|------|----------------------|-------------|
| POST | `/products` | `Product.Manage` | Add new product |
| GET | `/products` | `Product.Manage` | Search products with pagination, filter by category/search/favorites/lowStock |
| GET | `/products/{id}` | `Product.Manage` | Get single product |
| PATCH | `/products/{id}` | `Product.Manage` | Edit product (name, prices, threshold, category, favorite) |
| DELETE | `/products/{id}` | `Product.Manage` | Delete product (set SaleItem refs to null, then hard-delete) |
| PATCH | `/products/{id}/restock` | `Product.Manage` | Add stock quantity, optionally update cost price |
| PATCH | `/products/bulk-price` | `Product.Manage` | Bulk price adjust for multiple products |

**`GET /products` query parameters:**
- `page` (int, default 0) — page number for pagination
- `size` (int, default 20) — items per page
- `search` (string, optional) — filter by product name (LIKE search)
- `categoryId` (long, optional) — filter by category
- `favoritesOnly` (boolean, optional) — filter favorites only
- `lowStockOnly` (boolean, optional) — filter products where `quantity <= lowStockThreshold`
- `sortBy` (string, optional) — sort field (default: name). When `lowStockOnly=true`, default sort is `quantity ASC` (lowest stock first)

**`PATCH /products/bulk-price` request body:**
```json
{
  "productIds": [1, 2, 3],
  "selectAll": false,
  "categoryId": null,
  "search": null,
  "sellingPriceAction": "INCREASE_BY",
  "sellingPriceAmount": 1.00,
  "costPriceAction": "INCREASE_BY",
  "costPriceAmount": 0.50,
  "preview": true
}
```
- `selectAll`: if true, applies to all products matching the filter (categoryId/search), ignores productIds
- `preview`: if true, returns preview without applying changes
- Actions: `NO_CHANGE`, `INCREASE_BY`, `DECREASE_BY`, `SET_TO`
- Validation: prices cannot go below ₱0 after adjustment

### Categories

| Method | Path | @PreAuthorize App Role | Description |
|--------|------|----------------------|-------------|
| POST | `/categories` | `Category.Manage` | Create category |
| GET | `/categories` | `Category.Manage` | List all categories for the store (not paginated, typically 5-15) |
| PATCH | `/categories/{id}` | `Category.Manage` | Rename category |
| DELETE | `/categories/{id}` | `Category.Manage` | Delete category (products in it become uncategorized — set `category = null`) |

### Sales

| Method | Path | @PreAuthorize App Role | Description |
|--------|------|----------------------|-------------|
| POST | `/sales` | `Sale.Create` | Complete a sale (create sale + items, deduct inventory) |
| GET | `/sales` | `Sale.View` | Search sales by date with pagination |
| GET | `/sales/{id}` | `Sale.View` | Get sale details including items |
| PATCH | `/sales/{id}/void` | `Sale.Void` | Void a sale (restore inventory, mark as VOIDED). Request body: `{ "localDate": "2026-03-24" }` |

**`POST /sales` request body:**
```json
{
  "saleDate": "2026-03-24",
  "items": [
    { "productId": 1, "quantity": 2 },
    { "productId": 2, "quantity": 1 },
    { "productId": 3, "quantity": 3 }
  ]
}
```

**`POST /sales` backend logic:**
1. Validate all products exist and belong to the user's store
2. Validate each product has sufficient stock (`product.quantity >= requested quantity`). If not, return 400 with: `"Insufficient stock for {productName}. Available: {quantity}"`
3. For each item: snapshot `productName`, `sellingPrice`, `costPrice` from ProductEntity into SaleItemEntity
4. Calculate `subtotal = sellingPriceAtSale * quantity` and `profit = (sellingPriceAtSale - costPriceAtSale) * quantity` per item
5. Deduct stock: `product.quantity -= requested quantity`
6. Generate `saleNumber`: query MAX(saleNumber) for the store on the provided `saleDate` + 1 (first sale of the day = 1)
7. Set `saleDate` from the request body (the owner's local date, sent by frontend), `status = COMPLETED`
8. Calculate `totalAmount`, `totalProfit`, `totalItems` as sums across all items
9. Save SaleEntity and SaleItemEntities
10. Return the created sale with items

**`GET /sales` query parameters:**
- `page` (int, default 0)
- `size` (int, default 20)
- `date` (LocalDate, defaults to today) — filter by sale date
- Results ordered by `createdAt DESC` (most recent first)
- **30-day limit:** Backend enforces that `date` cannot be more than 30 days in the past. Return 400 if exceeded.

**`PATCH /sales/{id}/void` backend logic:**
1. Validate sale exists, belongs to user's store, and `status = COMPLETED`
2. Validate `sale.saleDate == localDate` (from request body) — only today's sales can be voided. Return 400: `"Only today's sales can be voided"` if past
3. Set `status = VOIDED`, `voidedAt = ZonedDateTime.now()`
4. Restore inventory: for each SaleItemEntity, if `product` is not null, `product.quantity += saleItem.quantity`
5. Save all changes

### Expenses

| Method | Path | @PreAuthorize App Role | Description |
|--------|------|----------------------|-------------|
| POST | `/expenses` | `Expense.Manage` | Add expense |
| GET | `/expenses` | `Expense.Manage` | Search expenses with pagination |
| PATCH | `/expenses/{id}` | `Expense.Manage` | Edit expense |
| DELETE | `/expenses/{id}` | `Expense.Manage` | Delete expense |

**`GET /expenses` query parameters:**
- `page` (int, default 0)
- `size` (int, default 20)
- Results ordered by `expenseDate DESC, createdAt DESC` (most recent first)
- **30-day limit:** Backend only returns expenses from the last 30 days.

### Reports

| Method | Path | @PreAuthorize App Role | Description |
|--------|------|----------------------|-------------|
| GET | `/reports/daily-summary` | `Report.View` | Daily sales summary for a given date |

**`GET /reports/daily-summary` query parameters:**
- `date` (LocalDate, defaults to today)
- **30-day limit:** Backend enforces that `date` cannot be more than 30 days in the past.

**`GET /reports/daily-summary` response:**
```json
{
  "date": "2026-03-24",
  "revenue": 2350.00,
  "productProfit": 730.00,
  "totalExpenses": 50.00,
  "actualProfit": 680.00,
  "transactionCount": 32,
  "itemsSold": 87,
  "topSellers": [
    { "productName": "Kopiko sachet", "quantitySold": 45 },
    { "productName": "Yosi stick", "quantitySold": 23 },
    { "productName": "C2 bottle", "quantitySold": 18 },
    { "productName": "Sardines (can)", "quantitySold": 12 },
    { "productName": "Lucky Me", "quantitySold": 9 }
  ],
  "topByRevenue": [
    { "productName": "Sardines (can)", "totalRevenue": 450.00 },
    { "productName": "C2 bottle", "totalRevenue": 360.00 },
    { "productName": "Kopiko sachet", "totalRevenue": 225.00 },
    { "productName": "Lucky Me", "totalRevenue": 180.00 },
    { "productName": "Yosi stick", "totalRevenue": 115.00 }
  ]
}
```

**Calculation logic (all exclude voided sales):**
- `revenue` = SUM(`totalAmount`) from SaleEntity WHERE `saleDate = date` AND `status = COMPLETED`
- `productProfit` = SUM(`totalProfit`) from SaleEntity WHERE `saleDate = date` AND `status = COMPLETED`
- `totalExpenses` = SUM(`amount`) from ExpenseEntity WHERE `expenseDate = date`
- `actualProfit` = `productProfit - totalExpenses`
- `transactionCount` = COUNT(SaleEntity) WHERE `saleDate = date` AND `status = COMPLETED`
- `itemsSold` = SUM(`totalItems`) from SaleEntity WHERE `saleDate = date` AND `status = COMPLETED`
- `topSellers` = aggregate SaleItemEntity by `productName`, SUM(`quantity`) as quantitySold, top 5, WHERE sale.`saleDate = date` AND sale.`status = COMPLETED`
- `topByRevenue` = aggregate SaleItemEntity by `productName`, SUM(`subtotal`) as totalRevenue, top 5, WHERE sale.`saleDate = date` AND sale.`status = COMPLETED`

---

## DTOs

### Request DTOs

| DTO | Used On | Fields |
|-----|---------|--------|
| `CreateStoreDto` | POST `/stores` | `storeName` (required) |
| `UpdateStoreDto` | PATCH `/stores/me` | `storeName` (required) |
| `ProductDto` | POST `/products`, PATCH `/products/{id}` | `name`, `sellingPrice`, `costPrice`, `quantity`, `lowStockThreshold`, `categoryId` (nullable), `isFavorite` |
| `RestockDto` | PATCH `/products/{id}/restock` | `addQuantity` (required, > 0), `newCostPrice` (nullable — only if supplier price changed) |
| `BulkPriceAdjustDto` | PATCH `/products/bulk-price` | `productIds`, `selectAll`, `categoryId`, `search`, `sellingPriceAction`, `sellingPriceAmount`, `costPriceAction`, `costPriceAmount`, `preview`, `page` (optional, default 0), `size` (optional, default 20) -- pagination params for preview results |
| `CategoryDto` | POST `/categories`, PATCH `/categories/{id}` | `name` (required) |
| `CreateSaleDto` | POST `/sales` | `items` (list of `CreateSaleItemDto`), `saleDate` (LocalDate, required — the owner's local date, sent by frontend) |
| `CreateSaleItemDto` | Nested in CreateSaleDto | `productId`, `quantity` |
| `VoidSaleDto` | PATCH `/sales/{id}/void` | `localDate` (required — owner's current local date for same-day validation) |
| `ExpenseDto` | POST `/expenses`, PATCH `/expenses/{id}` | `description`, `amount`, `expenseDate` |

### Response DTOs

| DTO | Used On | Fields |
|-----|---------|--------|
| `StoreResponseDto` | GET `/stores/me` | `id`, `storeName`, `ownerEmail` |
| `ProductResponseDto` | GET `/products/**` | `id`, `name`, `sellingPrice`, `costPrice`, `quantity`, `lowStockThreshold`, `categoryId`, `categoryName`, `isFavorite`, `isLowStock` |
| `CategoryResponseDto` | GET `/categories` | `id`, `name`, `productCount` |
| `SaleResponseDto` | GET `/sales/**` | `id`, `saleNumber`, `saleDate`, `totalAmount`, `totalProfit`, `totalItems`, `status`, `voidedAt`, `items` (list of `SaleItemResponseDto`), `createdAt` |
| `SaleItemResponseDto` | Nested in SaleResponseDto | `id`, `productId`, `productName`, `sellingPriceAtSale`, `costPriceAtSale`, `quantity`, `subtotal`, `profit` |
| `ExpenseResponseDto` | GET `/expenses` | `id`, `description`, `amount`, `expenseDate`, `createdAt` |
| `DailySummaryDto` | GET `/reports/daily-summary` | `date`, `revenue`, `productProfit`, `totalExpenses`, `actualProfit`, `transactionCount`, `itemsSold`, `topSellers`, `topByRevenue` |
| `TopSellerDto` | Nested in DailySummaryDto | `productName`, `quantitySold`, `totalRevenue` (nullable -- only populated for topByRevenue list) |
| `PriceChangePreviewDto` | PATCH `/products/bulk-price` (preview mode) | `productId`, `productName`, `currentSellingPrice`, `newSellingPrice`, `currentCostPrice`, `newCostPrice` — both preview and apply modes return `SearchResultDto<PriceChangePreviewDto>`. |
| `SearchResultDto<T>` | All paginated endpoints | `content` (list of T), `totalElements`, `totalPages`, `currentPage`, `hasNext` |

### Enums (used in DTOs)

| Enum | Values | Used In |
|------|--------|---------|
| `SaleStatusEnum` | `COMPLETED`, `VOIDED` | SaleEntity, SaleResponseDto |
| `PriceAdjustActionEnum` | `NO_CHANGE`, `INCREASE_BY`, `DECREASE_BY`, `SET_TO` | BulkPriceAdjustDto |

---

## Frontend Pages

### Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | HomePage | Login page (existing — reuse) |
| `/store-setup` | StoreSetupPage | First-time store name setup |
| `/sell` | SellPage | Main Selling Screen with product grid + cart bar + cart panel overlay |
| `/products` | ProductPage | Product Management list |
| `/products/add` | AddEditProductPage | Add new product |
| `/products/:id/edit` | AddEditProductPage | Edit existing product |
| `/categories` | CategoryPage | Category Management |
| `/reports` | ReportHubPage | Reports Hub (links to sub-screens) |
| `/reports/daily-summary` | DailySummaryPage | Daily Sales Summary with date navigation |
| `/reports/inventory` | InventoryPage | Inventory / Low Stock |
| `/reports/sales-history` | SalesHistoryPage | Sales History / Void |
| `/expenses` | ExpensePage | Expense Logger with add/edit dialog. Expense list is grouped by day with headers showing "Today", "Yesterday", or the formatted date, plus the total expense amount for that day. This is a frontend display feature -- the API returns a flat list sorted by date. |
| `/more` | MorePage | More Menu. Logout button shows a confirmation dialog ("Are you sure you want to logout?") before signing out. |
| `/more/quick-price-adjust` | QuickPriceAdjustPage | Bulk price adjustment. Includes a search bar and category filter chips to narrow down the product selection list. When "Select All" is checked with a category filter active, the bulk operation applies only to products matching that filter. |
| `/more/account-settings` | AccountSettingsPage | Display name (read-only) + email (read-only) + store name (editable) |
| `*` | PageNotFoundPage | 404 (existing — reuse) |

### Navigation & Layout

All routes except `/` (login) and `/store-setup` are wrapped in an **AuthenticatedLayout** component that includes:
- Bottom navigation bar with 5 tabs: Sell, Products, Reports, Expenses, More
- Active tab highlighted based on current route

**Protected route logic:**
- On every authenticated page load, call `GET /stores/me`
- If 404 (no store) → redirect to `/store-setup`
- If store exists → proceed to requested page
- If not authenticated → redirect to `/` (login)
- **Store load retry with exponential backoff:** For new users logging in via the API Gateway, the OBO token exchange and auto-group-assignment may not complete before the first `GET /stores/me` call, resulting in 403. The `AuthenticatedLayout` retries up to 5 times with exponential backoff delays `[1s, 2s, 3s, 4s, 5s]` (15s total coverage). Constants: `MAX_RETRIES = 5`, `RETRY_DELAYS_MS = [1000, 2000, 3000, 4000, 5000]`. On each non-404 failure, the next retry is scheduled with `setTimeout`. If all retries exhaust, a styled error card is shown (using `.errorCard` CSS class — white background, 16px border radius, box shadow, centered with padding) containing: a `:( ` Typography (h3), "Something went wrong" heading (h6, bold), a body2 message "We couldn't load your store. This can happen with new accounts — please try again.", and a large contained "Retry" Button with rounded corners. The `.loading` CSS class uses `flex-direction: column` to stack content vertically. The user sees "Loading..." during retries. Retry count is tracked via `useRef` to avoid re-render loops.

**Cart state is in Redux** — persisted across tab/page navigation within the session. Cleared on: sale completion, manual clear, or logout.

**ReportHubPage preview data:** Each card on the Reports Hub shows a live stat preview (per SystemDesign §13). Fetched from existing endpoints on page load — no new APIs needed:
- Daily Sales Summary card → `GET /reports/daily-summary` (today's revenue and profit)
- Inventory card → `GET /products?lowStockOnly=true&size=1` (use `totalElements` for low-stock count)
- Sales History card → `GET /sales?date=today&size=1` (use `totalElements` for today's sale count)
- **Skeleton loaders:** While each API call is in-flight, a MUI `<Skeleton variant="text">` placeholder is shown below the card title instead of blank space. Each card resolves independently — stats appear as their API responds.

### Frontend Structure

```
src/
├── api-client/axiosHttpClient.ts         (keep — auto-attaches Bearer token)
├── redux-toolkit/store.ts                (modify — add new slices)
├── security-oauth2/                      (keep — MSAL auth config)
├── components/
│   ├── layout/
│   │   ├── AuthenticatedLayout.tsx       (bottom nav + page wrapper)
│   │   ├── AuthenticatedLayout.module.css
│   │   └── BottomNav.tsx
│   ├── shared/
│   │   ├── InfiniteScrollList.tsx        (reusable infinite scroll component)
│   │   └── InfiniteScrollList.module.css
│   └── pages/
│       ├── home/HomePage.tsx             (keep — login page)
│       ├── pageNotFound/                 (keep — 404)
│       ├── storeSetup/
│       │   ├── StoreSetupPage.tsx
│       │   ├── StoreSetupPage.module.css
│       │   └── storeApiService.ts
│       ├── sell/
│       │   ├── SellPage.tsx              (product grid + category tabs + search + cart bar)
│       │   ├── SellPage.module.css
│       │   ├── sellSlice.ts              (cart state: items, totals)
│       │   ├── cartPanel/
│       │   │   ├── CartPanel.tsx          (slide-up overlay with cart items)
│       │   │   └── CartPanel.module.css
│       │   └── sellApiService.ts
│       ├── product/
│       │   ├── ProductPage.tsx           (product management list)
│       │   ├── ProductPage.module.css
│       │   ├── productSlice.ts
│       │   ├── addEditProduct/
│       │   │   ├── AddEditProductPage.tsx
│       │   │   └── AddEditProductPage.module.css
│       │   ├── categoryManagement/
│       │   │   ├── CategoryPage.tsx
│       │   │   └── CategoryPage.module.css
│       │   └── productApiService.ts
│       ├── report/
│       │   ├── ReportHubPage.tsx         (links to sub-screens)
│       │   ├── ReportHubPage.module.css
│       │   ├── reportSlice.ts
│       │   ├── dailySummary/
│       │   │   ├── DailySummaryPage.tsx
│       │   │   └── DailySummaryPage.module.css
│       │   ├── inventory/
│       │   │   ├── InventoryPage.tsx
│       │   │   └── InventoryPage.module.css
│       │   ├── salesHistory/
│       │   │   ├── SalesHistoryPage.tsx
│       │   │   └── SalesHistoryPage.module.css
│       │   └── reportApiService.ts
│       ├── expense/
│       │   ├── ExpensePage.tsx
│       │   ├── ExpensePage.module.css
│       │   ├── expenseSlice.ts
│       │   └── expenseApiService.ts
│       └── more/
│           ├── MorePage.tsx
│           ├── MorePage.module.css
│           ├── quickPriceAdjust/
│           │   ├── QuickPriceAdjustPage.tsx
│           │   └── QuickPriceAdjustPage.module.css
│           ├── accountSettings/
│           │   ├── AccountSettingsPage.tsx
│           │   └── AccountSettingsPage.module.css
│           └── (no moreApiService.ts — store API calls are in storeSetup/storeApiService.ts)
```

### Redux Slices

| Slice | State | Purpose |
|-------|-------|---------|
| `sellSlice` | `cartItems[]`, `cartTotal`, `cartItemCount`, `isCartOpen` | Cart state — persisted across tab navigation, cleared on sale/clear/logout |
| `productSlice` | `refreshTrigger` | Triggers product list refresh after add/edit/delete |
| `reportSlice` | `refreshTrigger` | Triggers report refresh after sale/void |
| `expenseSlice` | `refreshTrigger` | Triggers expense list refresh after add/edit/delete |

**Cart item structure (in sellSlice):**
```typescript
interface CartItem {
  productId: number;
  productName: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;        // quantity in cart
  availableStock: number;  // product's current stock (for limit enforcement)
  subtotal: number;        // sellingPrice * quantity
}
```

---

## Backend Package Structure

```
com.microservices/
├── config/                          (keep existing)
├── controllers/
│   ├── StoresController.java
│   ├── ProductsController.java
│   ├── CategoriesController.java
│   ├── SalesController.java
│   ├── ExpensesController.java
│   └── ReportsController.java
├── dtos/
│   ├── CreateStoreDto.java
│   ├── UpdateStoreDto.java
│   ├── StoreResponseDto.java
│   ├── ProductDto.java
│   ├── ProductResponseDto.java
│   ├── RestockDto.java
│   ├── BulkPriceAdjustDto.java
│   ├── PriceChangePreviewDto.java
│   ├── PriceAdjustActionEnum.java
│   ├── CategoryDto.java
│   ├── CategoryResponseDto.java
│   ├── CreateSaleDto.java
│   ├── CreateSaleItemDto.java
│   ├── SaleResponseDto.java
│   ├── SaleItemResponseDto.java
│   ├── VoidSaleDto.java
│   ├── SaleStatusEnum.java
│   ├── ExpenseDto.java
│   ├── ExpenseResponseDto.java
│   ├── DailySummaryDto.java
│   ├── TopSellerDto.java
│   └── SearchResultDto.java
├── entities/
│   ├── StoreEntity.java
│   ├── CategoryEntity.java
│   ├── ProductEntity.java
│   ├── SaleEntity.java
│   ├── SaleItemEntity.java
│   └── ExpenseEntity.java
├── repositories/
│   ├── StoreRepository.java
│   ├── CategoryRepository.java
│   ├── ProductRepository.java
│   ├── SaleRepository.java
│   ├── SaleItemRepository.java
│   └── ExpenseRepository.java
├── services/
│   ├── StoreService.java
│   ├── ProductService.java
│   ├── CategoryService.java
│   ├── SaleService.java
│   ├── ExpenseService.java
│   ├── ReportService.java
│   ├── impl/
│   │   ├── StoreServiceImpl.java
│   │   ├── ProductServiceImpl.java
│   │   ├── CategoryServiceImpl.java
│   │   ├── SaleServiceImpl.java
│   │   ├── ExpenseServiceImpl.java
│   │   └── ReportServiceImpl.java
│   └── mappers/
│       ├── StoreEntityDtoMapperService.java
│       ├── ProductEntityDtoMapperService.java
│       ├── CategoryEntityDtoMapperService.java
│       ├── SaleEntityDtoMapperService.java
│       ├── ExpenseEntityDtoMapperService.java
│       └── impl/
│           ├── StoreEntityDtoMapperServiceImpl.java
│           ├── ProductEntityDtoMapperServiceImpl.java
│           ├── CategoryEntityDtoMapperServiceImpl.java
│           ├── SaleEntityDtoMapperServiceImpl.java
│           └── ExpenseEntityDtoMapperServiceImpl.java
└── utils/                           (keep existing — add SecurityUtils)
    └── SecurityUtils.java           (extracts current user email from JWT)
```

---

## Key Implementation Details

### Store Scoping (Multi-Tenancy)

Every service method must scope queries to the current user's store:

```java
// SecurityUtils.java — new utility class
public class SecurityUtils {
    public static String getCurrentUserEmail() {
        JwtAuthenticationToken auth = (JwtAuthenticationToken)
            SecurityContextHolder.getContext().getAuthentication();
        // preferred_username = user's email (present in user tokens from social login)
        // azp = client ID (present in client credentials tokens used by integration tests)
        // Fallback matches AuditAware.java behavior
        String email = auth.getToken().getClaimAsString("preferred_username");
        if (email == null || email.isBlank()) {
            email = auth.getToken().getClaimAsString("azp");
        }
        return email;
    }
}
```

```java
// In every service method:
StoreEntity store = storeRepository.findByOwnerEmail(SecurityUtils.getCurrentUserEmail())
    .orElseThrow(() -> new StoreNotFoundException("Store not found. Please complete store setup."));
// Then use store.getId() to filter all queries
```

Every repository query that returns data must include `AND store_id = :storeId` (or JPA equivalent `findByStore(store)`).

### Sale Date (Timezone Handling)

SystemDesign states: "Day is based on the device's local date (midnight to midnight)." CLAUDE.md states: "All timestamps in UTC." To reconcile:
- **`saleDate` (LocalDate)** — represents the owner's local day. The **frontend sends this** with `POST /sales` using `dayjs().format('YYYY-MM-DD')` (device local date). The backend stores it as-is. This ensures a sale at 11pm PHT is recorded as today, not tomorrow (which would happen if the backend used `LocalDate.now()` in UTC).
- **`createdAt` / `updatedAt` (ZonedDateTime)** — from BaseEntity, always in UTC. Used for ordering within a day ("most recent first") and audit trail.
- **Expense date** — already sent by the frontend (date picker defaults to today). Same pattern — no timezone issue.
- **Void date check** — `PATCH /sales/{id}/void` compares `sale.saleDate` against the `localDate` sent by the frontend in the request body (not `LocalDate.now()` on the server).

### Sale Number Generation
- Format: sequential integer per day per store (1, 2, 3...)
- Query: `SELECT COALESCE(MAX(sale_number), 0) + 1 FROM sale WHERE store_id = :storeId AND sale_date = :saleDate`
- Display: "Sale #32" (prefixed on frontend)

### Infinite Scroll (Frontend Pattern)

The SystemDesign specifies infinite scroll for 6 screens (not MUI DataGrid tables). Implementation:

```typescript
// InfiniteScrollList.tsx — reusable component
// Uses IntersectionObserver on a sentinel div at the bottom of the list
// Props: fetchNextPage(), hasNextPage, isLoading, children
```

- Backend: Spring Data JPA `Pageable` returns `Page<T>` with `hasNext()`, `totalElements`, etc.
- Frontend: tracks `currentPage`, on sentinel visible → `currentPage++` → fetch next batch → append to list
- Search/filter resets to page 0 and replaces list
- No new dependencies — IntersectionObserver is a browser API

### Cart Panel (Frontend)

The cart panel is a **slide-up overlay** within `SellPage`, not a separate route. Controlled by `isCartOpen` in `sellSlice`.

- Opens when user taps the cart bar
- Closes with [X] button or completing/clearing sale
- Cart state persists in Redux across tab navigation
- Cart is cleared on: sale completion, manual clear, or logout

### SellPage Empty State (No Products)

When the store has no products yet, the SellPage shows: `"No products yet! Add your first product to start selling."` with a prominent [+ Add Product] button that navigates to `/products/add`. **Category tabs and the search bar are hidden** until at least one product exists. This matches SystemDesign §3 empty state.

**Flash prevention:** `isLoading` is initialized to `true` (not `false`) so the empty state guard (`!hasAnyProducts && !isLoading && !search && selectedCategory === null`) never passes on the first render. Without this, navigating to the Sell page briefly flashes "No products yet!" for one frame before the API call sets `isLoading = true`.

### Out-of-Stock Blocking

**Frontend:** Product cards are visually dimmed (reduced opacity) when `quantity = 0`. Tapping an out-of-stock product shows a warning snackbar: `"{productName} is out of stock. Update stock to make a sale."` There is no shortcut button to inventory — the snackbar is informational only.

**Backend:** Double-validates stock on `POST /sales`. If any product has insufficient stock, returns 400 with the specific product and available quantity. This prevents race conditions.

### Cost vs Selling Price Warning (Frontend Only)

When adding or editing a product, if the owner enters a cost price >= selling price, the frontend shows a **non-blocking warning**: `"Cost price is higher than or equal to selling price. Are you sure?"` The backend **allows** this (no validation rejection) — the owner knows their pricing. This is a frontend-only UX warning, not a backend validation rule.

### Frontend Display Details

**Sell Page — Stock in Cart indicator:** Each product card on the Sell page shows "Stock: X (Y in cart)" when items are in the cart, where X is remaining stock after cart deduction. Stock text turns red when at or below the product's low-stock alert threshold.

**Daily Summary — Profit color coding:** The Actual Profit value is color-coded: green when positive, red when negative.

**Tooltips:** Key interactive elements throughout the app have descriptive tooltips (arrow tooltips via MUI Tooltip component).

### Stock Enforcement on Cart Add

When adding to cart or increasing quantity:
- Frontend checks: `cartItem.quantity + 1 <= product.availableStock`
- If would exceed: show warning `"Only {availableStock} {productName} in stock."` and block the increase
- **Direct quantity input (real-time clamping):** When the user taps the quantity number in the cart to type a value, the `handleQtyChange` handler clamps the input immediately on every keystroke — not on blur. If the typed value exceeds `availableStock`, it is clamped to `availableStock`, an error snackbar shows `"Only {availableStock} {productName} in stock."`, and the Redux state (`setItemQuantity`) is dispatched immediately so cart totals, item counts, and the product grid all stay in sync. Values below 1 are clamped to 1. The `commitEdit` handler (on blur/Enter) acts as a safety net with the same clamping logic. The `+` button is disabled when `quantity >= availableStock`.

### Void Only Today

Backend enforces: `PATCH /sales/{id}/void` accepts a `localDate` field in the request body (the owner's current local date, sent by frontend). It checks `sale.saleDate == localDate`. If the sale is from a past day, return 400: `"Only today's sales can be voided."` Frontend hides the [Void Sale] button for past days' sales.

### 30-Day Visibility (Free Tier)

For MVP, all users are on the free tier:
- `GET /sales?date=...` — rejects dates more than 30 days ago
- `GET /reports/daily-summary?date=...` — rejects dates more than 30 days ago
- `GET /expenses` — only returns expenses from the last 30 days (with +1 day timezone buffer: `endDate = today + 1`, `startDate = endDate - 31 days`, to handle users in UTC+ timezones whose local "today" is ahead of server UTC)
- Date navigation [◀] button disabled on frontend when reaching 30 days ago
- Data beyond 30 days is **not deleted** — just hidden. Premium (future) removes the limit.

### Product Deletion Cascade

When deleting a product:
1. Service finds all SaleItemEntities referencing this product
2. Sets `product = null` on each (preserves `productName`, `sellingPriceAtSale`, `costPriceAtSale` snapshots)
3. Deletes the ProductEntity
4. Product disappears from selling grid and catalog
5. Past sales still show the product's name and prices from snapshots

### Duplicate Name Prevention

Product names must be unique per store (case-insensitive). Category names must be unique per store (case-insensitive). When creating or updating a product/category, the service checks for existing names (case-insensitive comparison) within the same store. If a duplicate is found, throws `DuplicateEntryException` (409).

### Category Deletion

When deleting a category:
1. Service finds all ProductEntities with this category
2. Sets `category = null` on each (products become uncategorized)
3. Deletes the CategoryEntity

### SecurityConfig Changes

Add `@PreAuthorize` patterns using `TindahanPOS.` prefix:
```java
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Store.Manage')")
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Product.Manage')")
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Category.Manage')")
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Sale.Create')")
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Sale.View')")
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Sale.Void')")
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Expense.Manage')")
@PreAuthorize("hasAuthority('SCOPE_TindahanPOS.Report.View')")
```

No public endpoints — all require authentication.

### Custom Exceptions

| Exception | HTTP Status | When Thrown |
|-----------|-------------|------------|
| `StoreNotFoundException` | 404 | Store not found for current user |
| `StoreAlreadyExistsException` | 409 | User tries to create a second store |
| `ProductNotFoundException` | 404 | Product not found or doesn't belong to user's store |
| `CategoryNotFoundException` | 404 | Category not found or doesn't belong to user's store |
| `SaleNotFoundException` | 404 | Sale not found or doesn't belong to user's store |
| `ExpenseNotFoundException` | 404 | Expense not found or doesn't belong to user's store |
| `InsufficientStockException` | 400 | Product stock insufficient for sale |
| `InvalidVoidException` | 400 | Trying to void a past day's sale or already-voided sale |
| `InvalidPriceException` | 400 | Price adjustment would result in negative price |
| `InvalidDateRangeException` | 400 | Date exceeds 30-day visibility limit |
| `DuplicateEntryException` | 409 | Product or category name already exists in the store (case-insensitive) |

### Daily Summary Computation

The daily summary is **computed on-the-fly** — not stored in a separate table. The `ReportServiceImpl` aggregates data from SaleEntity, SaleItemEntity, and ExpenseEntity for the requested date.

**Top sellers query** uses a custom JPQL `@Query` on SaleItemRepository with `Pageable` to limit results (MS SQL Server does not support `LIMIT` — use Spring's `PageRequest.of(0, 5)` instead):
```java
@Query("""
    SELECT si.productName, SUM(si.quantity) as totalQty
    FROM SaleItemEntity si
    JOIN si.sale s
    WHERE s.store.id = :storeId AND s.saleDate = :date AND s.status = 'COMPLETED'
    GROUP BY si.productName
    ORDER BY totalQty DESC
    """)
List<Object[]> findTopSellersByDate(
    @Param("storeId") Long storeId,
    @Param("date") LocalDate date,
    Pageable pageable  // pass PageRequest.of(0, 5) to get top 5
);
```

**Top sellers by revenue** uses a similar query but aggregates by `SUM(si.subtotal)` instead of `SUM(si.quantity)`:
```java
@Query("""
    SELECT si.productName, SUM(si.subtotal) as totalRevenue
    FROM SaleItemEntity si
    JOIN si.sale s
    WHERE s.store.id = :storeId AND s.saleDate = :date AND s.status = 'COMPLETED'
    GROUP BY si.productName
    ORDER BY totalRevenue DESC
    """)
List<Object[]> findTopSellersByRevenueAndStoreAndDate(
    @Param("storeId") Long storeId,
    @Param("date") LocalDate date,
    Pageable pageable  // pass PageRequest.of(0, 5) to get top 5
);
```

### MUI Components Used

| Component | Screen | Notes |
|-----------|--------|-------|
| `BottomNavigation` | All authenticated screens | 5 tabs: Sell, Products, Reports, Expenses, More |
| `Card` | Product grid, sales list, inventory, expenses, reports hub | Card-based UI throughout |
| `Button`, `IconButton` | Throughout | Actions, navigation |
| `TextField` | Forms, search | Product form, expense form, search bars |
| `Dialog` | Cart clear, void, delete, restock, add category, add expense | Confirmation and input dialogs |
| `Checkbox` | Quick Price Adjust | Product selection for bulk operations |
| `Radio` | Quick Price Adjust | Price adjustment action selection |
| `Chip` / `Tab` | Category tabs, filter tabs | Horizontal scrollable tabs |
| `Badge` | Inventory tab | Low stock count |
| `Snackbar` | Throughout | Success/error messages |
| `Drawer` | Cart Panel | Slide-up bottom drawer for cart |
| `DatePicker` | Expense form | MUI X DatePicker for expense date |

**Not used:** MUI X DataGrid — the SystemDesign specifies card-based layouts with infinite scroll, not data tables.

---

## Implementation Sequence

### Phase 1: Cleanup + Backend Foundation
1. Delete demo Session files from frontend and backend (use git for reference)
2. Create `SecurityUtils.java` (extract current user email from JWT)
3. Create enum: `SaleStatusEnum`, `PriceAdjustActionEnum`
4. Create entities: `StoreEntity`, `CategoryEntity`, `ProductEntity`, `SaleEntity`, `SaleItemEntity`, `ExpenseEntity`
5. Create repositories (with custom queries for store scoping, daily summary aggregation, sale number generation)
6. Create all DTOs (request + response)
7. Create mapper services
8. Create service interfaces and implementations
9. Create controllers with `@PreAuthorize`
10. Create custom exceptions

### Phase 2: Frontend Foundation
1. Delete demo Session files from frontend
2. Set up routes in `App.tsx` (all 16 routes)
3. Create `AuthenticatedLayout` with `BottomNav`
4. Create Redux slices (`sellSlice`, `productSlice`, `reportSlice`, `expenseSlice`) and register in `store.ts`
5. Create all API service files
6. Create `InfiniteScrollList` reusable component
7. Build `StoreSetupPage` — first-time store name form
8. Implement store check logic (GET `/stores/me` → redirect to `/store-setup` if 404)

### Phase 3: Product Catalog (needed before selling)
1. Build `ProductPage` — product management list with infinite scroll, category tabs, search
2. Build `AddEditProductPage` — form with React Hook Form (name, sellingPrice, costPrice, quantity, threshold, category dropdown, favorite checkbox)
3. Build `CategoryPage` — category CRUD with dialogs
4. Test: add products, add categories, edit, delete

### Phase 4: Core Selling Flow (THE demo flow)
1. Build `SellPage` — product grid (3 columns), category tabs, search, cart bar
2. Build `CartPanel` — slide-up drawer with cart items, quantity adjustment, remove, clear, complete sale
3. Implement cart Redux state (add item, increment, decrement, remove, clear)
4. Connect Complete Sale to `POST /sales`
5. Test full flow: tap products → cart → complete sale → verify inventory deducted

### Phase 5: Sales History + Void
1. Build `SalesHistoryPage` — date navigation, sale cards with infinite scroll
2. Implement [Void Sale] button for today's sales
3. Test: complete sale → view in history → void → verify inventory restored

### Phase 6: Daily Sales Summary
1. Build `DailySummaryPage` — date navigation, summary cards (revenue, profit, transactions, items), top sellers, profit breakdown
2. Connect to `GET /reports/daily-summary`
3. Test: complete sales → view summary → void a sale → verify summary recalculates

### Phase 7: Inventory
1. Build `InventoryPage` — [Low Stock] and [All] tabs, product cards with stock info, [+ Restock] button
2. Implement restock dialog (add quantity, optionally update cost price)
3. Test: sell items → check low stock alerts → restock → verify stock updated

### Phase 8: Expense Logger
1. Build `ExpensePage` — expense list grouped by day, [+ Add] button
2. Implement add/edit/delete expense dialogs
3. Test: add expenses → verify they appear in daily summary profit breakdown

### Phase 9: Quick Price Adjust + Remaining Screens
1. Build `QuickPriceAdjustPage` — product selection with checkboxes, bulk price adjustment, preview
2. Build `ReportHubPage` — navigation cards to daily summary, inventory, sales history
3. Build `MorePage` — navigation to quick price adjust, account settings, logout
4. Build `AccountSettingsPage` — edit store name, display email, logout button

### Phase 10: Integration Tests
1. Create `StoreIntegrationTest` — POST create, GET me
2. Create `ProductIntegrationTest` — CRUD products, restock, bulk price adjust
3. Create `SaleIntegrationTest` — full flow: create products → POST sale → GET sales → PATCH void
4. Create `ExpenseIntegrationTest` — CRUD expenses
5. Create `ReportIntegrationTest` — GET daily summary after creating sales and expenses
6. **Note:** Integration tests use client credentials flow (no `preferred_username`). The `GET /stores/me` endpoint relies on JWT email, so it cannot be tested with client credentials. Test store lookup by creating a store with a known email. `AuditAware` will use the `azp` claim for `createdBy`/`updatedBy` in test context.

---

## Azure Configuration (Claude to configure via Azure CLI)

**Prerequisites:** Azure CLI installed and Arnel logged in (`az login --tenant 6c8e8267-ac66-4118-862b-5c93489b67a9 --allow-no-subscriptions`). After login, Claude performs all steps below via `az rest` commands against Microsoft Graph API. See `CLAUDE.md` for the full Azure CLI how-to guide with exact commands.

**Status: These steps need to be done for TindahanPOS.** The existing BarangayConnect app roles in Azure should be **disabled** (set `isEnabled: false`) and the new TindahanPOS roles added. Do NOT delete BarangayConnect roles — just disable them to preserve their GUIDs.

### Step 1: Add App Roles on backend app registration (`a52b2d35-98fb-4e76-9a54-f369e177add4`)

PATCH the `appRoles` array on the backend app registration via Graph API. Include ALL existing BarangayConnect roles (with `isEnabled: false`) plus the new TindahanPOS roles (with `isEnabled: true`).

| App Role Value | Description |
|---------------|-------------|
| `TindahanPOS.Store.Manage` | Create and manage own store |
| `TindahanPOS.Product.Manage` | Full product CRUD + restock |
| `TindahanPOS.Category.Manage` | Full category CRUD |
| `TindahanPOS.Sale.Create` | Complete a sale |
| `TindahanPOS.Sale.View` | View sales history |
| `TindahanPOS.Sale.Void` | Void a completed sale |
| `TindahanPOS.Expense.Manage` | Full expense CRUD |
| `TindahanPOS.Report.View` | View daily summary and reports |

### Step 2: Assign app roles as Application permissions to API Gateway (`8547fc0f-10c6-4de9-8e16-32f10341409f`)

Assign **all 8 TindahanPOS app roles** to the API Gateway service principal so the client credentials token (used in integration tests) has all permissions.

### Step 3: Grant admin consent for the new permissions

Done implicitly by Step 2 — assigning via Graph API is equivalent to granting admin consent. Verify with `GET /servicePrincipals/{apiGatewaySpObjectId}/appRoleAssignments`.

### Step 4: Create StoreOwner group and assign app roles

Create the StoreOwner group via `POST /groups` and assign all 8 TindahanPOS roles.

| Group | App Roles |
|-------|-----------|
| StoreOwner | All 8 TindahanPOS app roles |

### Step 5: Assign test user (`selena.arnel@gmail.com`) to the StoreOwner group

Add user to group via `POST /groups/{groupId}/members/$ref`.

### Step 6: Change API Gateway auto-assign group to StoreOwner

Update the APIM policy to auto-assign new social login users to the StoreOwner group instead of the BarangayConnect Resident group. Update the group Object ID in the policy XML.
