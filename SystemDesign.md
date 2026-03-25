# TindahanPOS — System Design (UI Flows & Business Logic)

*Low-level business requirement document. No technical details — purely UI screens, flows, navigation, and business logic.*

*All screens are mobile-first (phone layout). Same screens work on tablet/laptop via responsive scaling.*

---

## Screen Map (Navigation Overview)

```
[Login (Google)] → [Store Setup (first time only)] → [Main Selling Screen (Home)]
                              │
                ┌─────────────┼─────────────────┐
                │             │                  │
          [Cart Panel]   [Bottom Nav]       [Product Search]
                              │
              ┌───────┬───────┼───────┬──────────┐
              │       │       │       │          │
           [Sell]  [Products] [Reports] [Expenses] [More]
              │       │         │        │          │
           (Home)     │         │        │     [Quick Price Adjust]
                      │         │        │     [Account Settings]
               [Add Product]    │    [Add Expense]
               [Edit Product]   │    [Expense List]
               [Categories]     │
                                │
                     [Daily Sales Summary]
                     [Inventory / Low Stock]
                     [Sales History / Void]
```

---

## Pagination Strategy

All list screens use **server-side pagination with infinite scroll** — the frontend loads 20 items at a time from the backend, and loads the next batch as the user scrolls near the bottom. This prevents performance issues when data grows to hundreds or thousands of rows.

| Screen | Paginated? | Batch Size | Notes |
|---|---|---|---|
| Product grid (Selling) | Yes | 20 products | Filtered by active category/search |
| Product Management list | Yes | 20 products | Filtered by category/search |
| Inventory screen | Yes | 20 products | Low-stock items loaded first |
| Quick Price Adjust | Yes | 20 products | Filtered by category/search |
| Sales History | Yes | 20 sales | Filtered by selected date, most recent first |
| Expense Logger | Yes | 20 expenses | Grouped by day, most recent first |
| Category tabs | No | — | Horizontal scroll, typically 5-15 categories |
| Cart items | No | — | Typically 1-10 items per transaction |
| Top sellers (summary) | No | — | Fixed at top 5 each (by quantity + by revenue) |

**Infinite scroll behavior:**
- First load: fetch 20 items from server
- As user scrolls near the bottom: automatically fetch next 20
- Show a small loading spinner at bottom while fetching
- Stop fetching when all items are loaded ("No more items")
- Search/filter resets pagination and fetches fresh from page 1

---

## 1. Login Screen

**Purpose:** The landing page. Store owner logs in using their Google account. No manual registration needed.

```
┌─────────────────────────┐
│                         │
│       TindahanPOS       │
│  The simplest POS for   │
│  every sari-sari store  │
│                         │
│                         │
│  ┌───────────────────┐  │
│  │ 🔵 Sign in with   │  │
│  │    Google         │  │
│  └───────────────────┘  │
│                         │
│                         │
└─────────────────────────┘
```

**Business Logic:**
- User taps "Sign in with Google" → Google OAuth login flow opens
- **First-time user:** After Google login, account is automatically created using their Google email and name. Redirect to Store Setup screen.
- **Returning user:** After Google login, redirect directly to Main Selling Screen.
- User session persists until they log out (no re-login needed every visit)
- No email/password registration — Google handles authentication
- **Store load retry with exponential backoff:** After login, the app calls `GET /stores/me` to determine if the user has a store. For new users, the API Gateway needs time to auto-assign the user to the StoreOwner group and complete the OBO token exchange — the first few calls may fail with 403. The app retries up to 5 times with exponential backoff delays (1s, 2s, 3s, 4s, 5s — total 15s coverage). If a retry succeeds with 404, the user is redirected to Store Setup. If all retries fail, an error card is shown (centered on screen, white card with rounded corners and shadow) displaying a ":(" icon, "Something went wrong" heading, a helpful message "We couldn't load your store. This can happen with new accounts — please try again.", and a prominent "Retry" button. The user sees "Loading..." during retries.

**Future:** Add Facebook, Apple, and other social login options.

---

## 2. Store Setup Screen (First-Time Only)

**Purpose:** First-time user sets up their store name after Google login. Only shown once.

```
┌─────────────────────────┐
│       TindahanPOS       │
│                         │
│  Welcome! Let's set up  │
│  your store.            │
│                         │
│  Store Name *           │
│  ┌───────────────────┐  │
│  │ e.g., Aling Maria │  │
│  │ Sari-Sari Store   │  │
│  └───────────────────┘  │
│                         │
│  [   Get Started    ]   │
│                         │
└─────────────────────────┘
```

**Fields:**
- Store Name (required) — displayed in reports and header

**Business Logic:**
- Only shown on first login (account just created)
- Store name is required, cannot be empty
- After saving → redirect to Main Selling Screen (empty store, no products yet)
- Store name can be changed later in Account Settings


---

## 3. Main Selling Screen (Home)

**Purpose:** This is the primary screen. The owner spends 90% of their time here — tapping products to build a cart and completing sales.

```
┌─────────────────────────────┐
│     TindahanPOS    🔍 Search │
├─────────────────────────────┤
│ [Favorites] [Beverages]     │
│ [Snacks] [Canned] [All]    │
├─────────────────────────────┤
│                             │
│ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │ 📦  │ │ 📦  │ │ 📦  │   │
│ │Yosi │ │Sard-│ │C2   │   │
│ │₱9   │ │ines │ │₱10  │   │
│ │     │ │₱15  │ │     │   │
│ └─────┘ └─────┘ └─────┘   │
│ ┌─────┐ ┌─────┐ ┌─────┐   │
│ │ 📦  │ │ 📦  │ │ 📦  │   │
│ │Kopik│ │Sham-│ │Lucky │   │
│ │o    │ │poo  │ │Me    │   │
│ │₱3   │ │₱4   │ │₱12  │   │
│ └─────┘ └─────┘ └─────┘   │
│                             │
│ (infinite scroll, 20 per    │
│  batch, loads more on       │
│  scroll)                    │
│                             │
├─────────────────────────────┤
│ 🛒 Cart (6 items)    ₱49  │
│ [View Cart / Complete Sale] │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Layout (top to bottom):**
1. **Top bar** — App name and search icon (🔍)
2. **Category tabs** — Horizontal scrollable tabs. "Favorites" is always the first tab. "All" shows every product. Owner-created categories in between.
3. **Product grid** — 3 columns of tappable product buttons. Each button shows: placeholder image (📦), product name, selling price, and current stock. When items are in the cart, the card shows "Stock: X (Y in cart)" where X is the remaining stock after cart deduction and Y is the quantity in the cart — this gives the owner instant visibility of real-time availability. If a product's current stock is at or below its low-stock alert threshold, the stock text turns red as a visual warning. Grid is vertically scrollable.
4. **Cart bar** — Sticky bar at bottom of grid showing: item count, total price, and a button to view cart / complete sale. Only visible when cart has items.
5. **Bottom navigation** — 5 tabs: Sell (home), Products, Reports, Expenses, More.

**Interaction — Adding to Cart:**
- Owner taps a product button → item is added to cart with quantity 1
- Tapping the same product again → quantity increases by 1. If cart quantity would exceed available stock, show warning: "Only 5 Sardines in stock." and block the increase.
- Cart bar updates immediately (item count + total)

**Interaction — Search:**
- Owner taps 🔍 → search bar expands at top
- Type product name → grid filters in real-time to show matching products
- Tap a result → adds to cart (same as tapping from grid)
- Tap X or clear → returns to normal grid view

**Interaction — Category Tabs:**
- Tap a category tab → grid shows only products in that category
- "Favorites" tab shows pinned products only
- "All" tab shows every product
- Active tab is visually highlighted

**Empty State (first-time user / no products):**
- If the store has no products yet, the product grid area shows: "No products yet! Add your first product to start selling." with a prominent [+ Add Product] button that navigates to the Add Product screen. Category tabs are hidden until categories exist. The search bar is hidden until products exist, but remains visible if the user is actively typing a search.
- The empty state message only appears after the product list has finished loading — it does not flash briefly when switching between screens.

---

## 4. Cart Panel

**Purpose:** Review items before completing a sale. Appears when owner taps the cart bar on the Main Selling Screen.

```
┌─────────────────────────────┐
│ 🛒 Cart              [X]   │
├─────────────────────────────┤
│                             │
│ Sardines (can)              │
│ ₱15 x 2           ₱30     │
│ [-] [2] [+]       [Remove] │
│─────────────────────────────│
│ C2 (bottle)                 │
│ ₱10 x 1           ₱10     │
│ [-] [1] [+]       [Remove] │
│─────────────────────────────│
│ Kopiko sachet               │
│ ₱3 x 3            ₱9      │
│ [-] [3] [+]       [Remove] │
│                             │
├─────────────────────────────┤
│ Items: 6       Total: ₱49  │
│                             │
│ [  Clear Cart  ]            │
│ [ Complete Sale ✓ ]         │
└─────────────────────────────┘
```

**Layout:**
- List of items in cart, each showing: product name, unit price x quantity, subtotal, and remaining available stock (total stock minus quantity in cart — so the owner knows how much is left on the shelf)
- Per item: [-] and [+] buttons to adjust quantity, [Remove] to delete from cart
- Bottom: total item count, total price, Clear Cart button, Complete Sale button

**Interaction — Adjust Quantity:**
- Tap [+] → quantity increases by 1, subtotal and total update. If quantity would exceed available stock, show warning: "Only 5 Sardines in stock." and block the increase.
- Tap [-] → quantity decreases by 1. If quantity reaches 0, item is removed from cart.
- Owner can also tap the quantity number to type a specific number (e.g., type "10" for 10 sachets). **Real-time clamping:** if the typed number exceeds available stock, it is immediately clamped to the maximum available stock, a warning snackbar shows "Only {X} {productName} in stock.", and the cart totals update instantly. The input never displays a value above the available stock.

**Interaction — Remove Item:**
- Tap [Remove] → item is removed from cart, totals update
- This is the pre-sale correction (part of Void/Correction feature)

**Interaction — Clear Cart:**
- Tap [Clear Cart] → confirmation dialog: "Clear Cart?" with a message "Remove all items from the cart?"
- Clear → cart is emptied, returns to Main Selling Screen
- Cancel → stays on cart

**Interaction — Complete Sale:**
- Tap [Complete Sale] → sale completes immediately (no confirmation dialog):
  - Sale is recorded (timestamp, items, quantities, prices, total, profit)
  - Inventory is deducted for each item (e.g., sardines stock -2, C2 stock -1, Kopiko stock -3)
  - Cart is cleared
  - Success snackbar: "Sale completed!"
  - Returns to Main Selling Screen

**Business Logic:**
- If a product's stock is 0, the product card is visually dimmed (reduced opacity) and shows "Stock: 0". Tapping it shows a warning snackbar: "ProductName is out of stock. Update stock to make a sale." and the item is NOT added to the cart. This keeps inventory data accurate — if there's physical stock on the shelf, the owner updates the count first, then sells.
- Sale records store the selling price and cost price AT THE TIME OF SALE (not current price — so future price changes don't affect historical records)
- Each sale generates a profit record: (selling price - cost price) x quantity for each item
- **Cart persistence:** The cart is preserved when the owner navigates to other tabs (Products, Reports, Expenses, More) and returns to the Sell tab. The cart is only cleared when the owner completes a sale, clears it manually, or logs out.

---

## 5. Product Management Screen

**Purpose:** Owner manages their product catalog — add, edit, delete products, manage categories and favorites.

```
┌─────────────────────────────┐
│ ←  Products          [+ Add]│
├─────────────────────────────┤
│ 🔍 Search products...      │
├─────────────────────────────┤
│ [All] [Beverages] [Snacks]  │
│ [Canned] [Categories ⚙]    │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 📦 Sardines (can)       │ │
│ │ ₱15  Stock: 48          │ │
│ │ [Canned]  ⭐ Favorite   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 📦 C2 (bottle)          │ │
│ │ ₱10  Stock: 24          │ │
│ │ [Beverages]             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 📦 Kopiko sachet        │ │
│ │ ₱3   Stock: 3 ⚠ LOW    │ │
│ │ [Snacks]                │ │
│ └─────────────────────────┘ │
│                             │
│ (infinite scroll, 20 per    │
│  batch)                     │
│                             │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Layout:**
- Top: back arrow, title, [+ Add] button to add new product
- Search bar to filter products by name (resets pagination, fetches fresh results)
- Category tabs (same as selling screen) + a [Categories ⚙] button to manage categories
- Product list showing: placeholder image, name, selling price, stock count, category badge, favorite star, low-stock indicator (cost price is not shown in the list — visible on edit screen and inventory screen)
- Infinite scroll: loads 20 products per batch

**Interaction — Tap a Product:**
- Opens the Edit Product screen for that product

**Interaction — [+ Add]:**
- Opens the Add Product screen

**Interaction — [Categories ⚙]:**
- Opens the Category Management screen

---

## 6. Add / Edit Product Screen

**Purpose:** Owner adds a new product or edits an existing one.

```
┌─────────────────────────────┐
│ ←  Add Product       [Save] │
├─────────────────────────────┤
│                             │
│  Product Name *             │
│  ┌───────────────────────┐  │
│  │ e.g., Sardines (can)  │  │
│  └───────────────────────┘  │
│                             │
│  Selling Price *            │
│  ┌───────────────────────┐  │
│  │ ₱ 0.00                │  │
│  └───────────────────────┘  │
│                             │
│  Cost Price *               │
│  ┌───────────────────────┐  │
│  │ ₱ 0.00                │  │
│  └───────────────────────┘  │
│                             │
│  Quantity in Stock *        │
│  ┌───────────────────────┐  │
│  │ 0                     │  │
│  └───────────────────────┘  │
│                             │
│  Low-Stock Alert Threshold  │
│  ┌───────────────────────┐  │
│  │ 5 (default)           │  │
│  └───────────────────────┘  │
│                             │
│  Category                   │
│  ┌───────────────────────┐  │
│  │ Select category ▼     │  │
│  └───────────────────────┘  │
│                             │
│  ☐ Add to Favorites         │
│                             │
│  [     Save Product     ]   │
│                             │
│  [   Delete Product  ]      │
│  (only on Edit screen)      │
│                             │
└─────────────────────────────┘
```

**Fields:**
- Product Name (required) — text input
- Selling Price (required) — number input with ₱ prefix
- Cost Price (required) — number input with ₱ prefix
- Quantity in Stock (required) — number input
- Low-Stock Alert Threshold (optional, defaults to 5) — number input
- Category (optional) — dropdown of existing categories, or "None"
- Add to Favorites (optional) — checkbox

**Business Logic — Add:**
- All required fields must be filled
- Selling price must be greater than 0
- Cost price must be greater than 0
- Cost price should be less than selling price (show warning if not, but allow it — owner knows their pricing). Specifically, if the cost price is greater than or equal to the selling price, a non-blocking warning is shown: "Cost price is higher than or equal to selling price. Are you sure?" The owner can still save — this is just a heads-up, not a blocker.
- **Duplicate product name prevention:** Product names must be unique per store (case-insensitive). Attempting to add a product with a name that already exists shows an error: "Product [name] already exists."
- Quantity must be 0 or greater
- After save → product appears in the selling grid immediately
- Redirect back to Product Management screen

**Business Logic — Edit:**
- Same validation as Add
- Changing selling price or cost price does NOT affect past sales (historical prices are preserved)
- [Delete Product] button with confirmation: "Delete 'Sardines (can)'? This will permanently delete this product. Past sales records will be preserved."
- Deleting a product removes it from the selling grid and catalog but does NOT delete historical sales data involving that product
- **Sales history preservation on delete:** When a product is deleted, the product reference is cleared from historical sale items, but the sale records themselves (including the product name, price, and quantity at time of sale) are preserved. This maintains a complete audit trail.

---

## 7. Category Management Screen

**Purpose:** Owner creates, edits, and deletes product categories.

```
┌─────────────────────────────┐
│ ←  Categories     [+ Add]   │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ Beverages        (12)   │ │
│ │                  [Edit] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Snacks           (8)    │ │
│ │                  [Edit] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Canned Goods     (15)   │ │
│ │                  [Edit] │ │
│ └─────────────────────────┘ │
│                             │
└─────────────────────────────┘
```

**Layout:**
- List of categories with product count per category
- [+ Add] to create a new category
- [Edit] per category to rename or delete

**Interaction — [+ Add]:**
- Dialog: "Category Name:" with text input and Save/Cancel
- After save → category appears in list and in category tabs on selling screen

**Interaction — [Edit]:**
- Dialog with current name pre-filled, Save/Cancel/Delete buttons
- Delete confirmation: "Delete Category?" with a message "Products in this category will become uncategorized."
- Deleting a category does NOT delete the products — they just lose their category assignment
- **Duplicate category name prevention:** Category names must be unique per store (case-insensitive). Attempting to add a duplicate shows an error: "Category [name] already exists."

---

## 8. Daily Sales Summary Screen

**Purpose:** Owner reviews today's sales performance at a glance.

```
┌─────────────────────────────┐
│ ←  Daily Summary            │
├─────────────────────────────┤
│                             │
│  [◀] 📅 March 24, 2026 [▶] │
│                             │
│  ┌────────┐  ┌────────┐    │
│  │REVENUE │  │PROFIT  │    │
│  │₱2,350  │  │₱680    │    │
│  └────────┘  └────────┘    │
│  ┌────────┐  ┌────────┐    │
│  │SALES   │  │ITEMS   │    │
│  │32      │  │87      │    │
│  │transac-│  │total   │    │
│  │tions   │  │items   │    │
│  └────────┘  └────────┘    │
│                             │
│  Top by Quantity             │
│  ─────────────────────────  │
│  1. Kopiko sachet    x45    │
│  2. Yosi stick       x23   │
│  3. C2 bottle        x18   │
│  4. Sardines (can)   x12   │
│  5. Lucky Me         x9    │
│                             │
│  Top by Revenue              │
│  ─────────────────────────  │
│  1. Sardines (can)   ₱720  │
│  2. Lucky Me         ₱432  │
│  3. C2 bottle        ₱180  │
│  4. Kopiko sachet    ₱135  │
│  5. Yosi stick       ₱115  │
│                             │
│  Profit Breakdown           │
│  ─────────────────────────  │
│  Product profit:    ₱730    │
│  Expenses:         -₱50    │
│  ─────────────────────────  │
│  Actual profit:     ₱680   │
│                             │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Layout:**
- Date with [◀] and [▶] navigation arrows to browse previous/next days
- 4 summary cards: Revenue (total selling price of all sales for the selected date), Profit (product profit minus expenses for the selected date), Transactions (number of completed sales), Items Sold (total quantity across all sales)
- Top by Quantity (top 5 products ranked by quantity sold on the selected date)
- Top by Revenue (top 5 products ranked by revenue on the selected date)
- Profit Breakdown showing product profit, expenses, and actual profit
- **Profit color coding:** The Actual Profit value is color-coded: green when positive, red when negative. This provides instant visual feedback on whether the day was profitable.

**Business Logic:**
- Revenue = sum of (selling price x quantity) for all sales on the selected date
- Product Profit = sum of ((selling price - cost price) x quantity) for all sales on the selected date
- Actual Profit = Product Profit - Total Expenses logged on the selected date
- Transactions = count of completed sales on the selected date
- Items Sold = sum of all quantities across all sales on the selected date
- Top by Quantity = products ranked by total quantity sold on the selected date
- Top by Revenue = products ranked by total revenue (selling price x quantity) on the selected date
- Voided sales are excluded from all calculations (revenue, profit, transactions, items sold, top sellers)
- Date defaults to today when opening the screen
- [◀] goes to the previous day, [▶] goes to the next day (disabled if already on today)
- **30-day visibility (free tier):** Only the last 30 days of daily summaries are browsable. [◀] is disabled beyond 30 days ago. Older summaries become visible on Premium. Days with no sales show "No sales recorded on this day."
- "Day" is based on the device's local date (midnight to midnight)
- Data refreshes each time the screen is opened or date is changed

---

## 9. Inventory Screen

**Purpose:** Owner checks stock levels and sees which products need restocking.

```
┌─────────────────────────────┐
│ ←  Inventory                │
├─────────────────────────────┤
│ [⚠ Low Stock (3)] [All]    │
├─────────────────────────────┤
│                             │
│ ⚠ LOW STOCK                │
│ ┌─────────────────────────┐ │
│ │ Shampoo sachet          │ │
│ │ Stock: 0  (alert: ≤5)   │ │
│ │ [+ Restock]             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Yosi stick              │ │
│ │ Stock: 2  (alert: ≤5)   │ │
│ │ [+ Restock]             │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Kopiko sachet           │ │
│ │ Stock: 3  (alert: ≤5)   │ │
│ │ [+ Restock]             │ │
│ └─────────────────────────┘ │
│                             │
│ ─────────────────────────── │
│ OK STOCK                    │
│ ┌─────────────────────────┐ │
│ │ Sardines (can)          │ │
│ │ Stock: 48               │ │
│ │ [+ Restock]             │ │
│ └─────────────────────────┘ │
│ (more items...)             │
│                             │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Layout:**
- Tab filters: [⚠ Low Stock] shows only products at or below their threshold, [All] shows everything
- Low stock count badge on the tab (e.g., "3" items need restocking)
- Product cards showing: name, current stock, threshold, [+ Restock] button
- Low stock items are shown first, sorted by urgency (lowest stock first)
- Infinite scroll: loads 20 products per batch

**Interaction — [+ Restock]:**
- Dialog: "Add stock for Kopiko sachet. Current: 3. Add how many?"
- Number input field
- Save → stock count increases by the entered amount (e.g., current 3 + add 50 = new stock 53)
- Optionally update cost price if the supplier price changed: "Did the cost price change? Current: ₱2" with Yes/No

**Business Logic:**
- Low stock = current stock ≤ product's low-stock threshold
- Stock is never negative (if somehow it goes below 0, display 0)
- Restocking adds to existing stock (not replaces)
- The inventory screen is also accessible from the Reports tab in bottom nav

---

## 10. Expense Logger Screen

**Purpose:** Owner logs overhead expenses and sees how they affect profit.

```
┌─────────────────────────────┐
│ ←  Expenses          [+ Add]│
├─────────────────────────────┤
│                             │
│ Today                 ₱50   │
│ ┌─────────────────────────┐ │
│ │ Electricity        ₱30  │ │
│ │            [Edit][Delete]│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Plastic bags       ₱20  │ │
│ │            [Edit][Delete]│ │
│ └─────────────────────────┘ │
│                             │
│ Yesterday             ₱150  │
│ ┌─────────────────────────┐ │
│ │ Transportation     ₱100 │ │
│ │            [Edit][Delete]│ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Electricity             │ │
│ │ ₱50        Mar 23, 2026 │ │
│ │            [Edit][Delete]│ │
│ └─────────────────────────┘ │
│                             │
│ (infinite scroll, 20 per    │
│  batch, grouped by day)     │
│                             │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Layout:**
- [+ Add] button at top
- Today's total expenses
- Expense list grouped by day, most recent first. Each day group has a header showing the day label ("Today", "Yesterday", or the formatted date) and the total expense amount for that day displayed in red. This gives the owner a quick view of daily spending.
- Each entry shows: description, amount, date, Edit and Delete buttons

**Interaction — [+ Add]:**
```
┌─────────────────────────┐
│  Add Expense            │
│                         │
│  Description *          │
│  ┌───────────────────┐  │
│  │ e.g., Electricity │  │
│  └───────────────────┘  │
│                         │
│  Amount *               │
│  ┌───────────────────┐  │
│  │ ₱ 0.00            │  │
│  └───────────────────┘  │
│                         │
│  Date                   │
│  ┌───────────────────┐  │
│  │ Mar 24, 2026      │  │
│  └───────────────────┘  │
│  (defaults to today)    │
│                         │
│  [Save]  [Cancel]       │
└─────────────────────────┘
```

**Fields:**
- Description (required) — text input
- Amount (required) — number input with ₱ prefix, must be greater than 0
- Date (optional, defaults to today) — date picker

**Business Logic:**
- Expenses are grouped by date in the list
- Expenses feed into the Daily Sales Summary profit calculation
- Edit follows same validation as Add
- Delete confirmation: "Delete Expense?" with a message "Delete expense 'Electricity ₱30.00'?"
- **30-day visibility (free tier):** Only expenses from the last 30 days are shown in the list. Older expenses are NOT deleted — they are stored in the database and become visible again if the owner upgrades to Premium. Past daily summaries that used those expenses retain their original calculated profit (they are never retroactively changed).

---

## 11. Quick Price Adjust Screen

**Purpose:** Owner updates selling price and/or cost price for one or multiple products when supplier prices change.

```
┌─────────────────────────────┐
│ ←  Quick Price Adjust       │
├─────────────────────────────┤
│ 🔍 Search products...      │
│ [All] [Beverages] [Snacks]  │
├─────────────────────────────┤
│                             │
│ ☐ Select All                │
│                             │
│ ┌─────────────────────────┐ │
│ │ ☐ Sardines (can)        │ │
│ │   Sell: ₱15  Cost: ₱12 │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ☑ C2 (bottle)           │ │
│ │   Sell: ₱10  Cost: ₱7  │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ☑ Kopiko sachet         │ │
│ │   Sell: ₱3   Cost: ₱2  │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ 2 products selected         │
│                             │
│ Adjust Selling Price:       │
│ (○ No change)               │
│ (● Increase by) [₱ 1 ]     │
│ (○ Decrease by) [₱   ]     │
│ (○ Set to)      [₱   ]     │
│                             │
│ Adjust Cost Price:          │
│ (○ No change)               │
│ (● Increase by) [₱ 0.50 ]  │
│ (○ Decrease by) [₱   ]     │
│ (○ Set to)      [₱   ]     │
│                             │
│ [  Preview Changes  ]       │
└─────────────────────────────┘
```

**After tapping [Preview Changes]:**
```
┌─────────────────────────────┐
│  Preview Price Changes      │
├─────────────────────────────┤
│                             │
│ C2 (bottle)                 │
│ Sell: ₱10 → ₱11            │
│ Cost: ₱7  → ₱7.50          │
│                             │
│ Kopiko sachet               │
│ Sell: ₱3  → ₱4             │
│ Cost: ₱2  → ₱2.50          │
│                             │
├─────────────────────────────┤
│ [Cancel]  [Apply Changes]   │
└─────────────────────────────┘
```

**Pagination:** Product list uses infinite scroll (20 per batch), filtered by category/search.

**Interaction Flow:**
1. Owner selects one or more products via checkboxes (or Select All — tells the server to apply changes to ALL matching products, not just the ones currently loaded on screen. If a category/search filter is active, Select All applies only to products matching that filter.)
2. Choose adjustment type for selling price and/or cost price: increase by, decrease by, set to, or no change
3. Enter the amount
4. Tap [Preview Changes] to see before/after
5. Tap [Apply Changes] to confirm

**Business Logic:**
- Prices cannot go below ₱0 (show error if decrease would result in negative)
- Changes take effect immediately on the selling grid
- Historical sales retain their original prices

---

## 12. Void / Correction Screen (Sales History)

**Purpose:** Owner views recent sales and can void incorrect ones.

```
┌─────────────────────────────┐
│ ←  Sales History            │
├─────────────────────────────┤
│                             │
│  [◀] March 24, 2026 [▶]   │
│                             │
│ ┌─────────────────────────┐ │
│ │ Sale #32       2:45 PM  │ │
│ │ Sardines x2, C2 x1     │ │
│ │ Total: ₱40              │ │
│ │ Profit: ₱9              │ │
│ │              [Void Sale] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Sale #31       2:30 PM  │ │
│ │ Kopiko x5, Yosi x2     │ │
│ │ Total: ₱33              │ │
│ │ Profit: ₱10             │ │
│ │              [Void Sale] │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ Sale #30       1:15 PM  │ │
│ │ ❌ VOIDED               │ │
│ │ Lucky Me x3             │ │
│ │ Total: ₱36              │ │
│ └─────────────────────────┘ │
│                             │
│ (infinite scroll, 20 per    │
│  batch, selected date)      │
│                             │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Layout:**
- Date with [◀] and [▶] navigation arrows to browse previous/next days (defaults to today)
- List of sales for the selected date, most recent first
- Each sale shows: sale number, time, items summary, total, profit, [Void Sale] button (only for today's sales)
- Voided sales are visually marked (❌ VOIDED, greyed out) and don't have a void button
- Past days' sales are view-only (no void button)

**Interaction — [Void Sale]:**
- Confirmation: "Void Sale #32?" with a message "This will restore inventory and mark the sale as voided. This cannot be undone." and a line listing the items to be restored: "Inventory will be restored for: Sardines x2, C2 x1"
- Yes →
  - Sale is marked as voided (not deleted — kept for audit trail)
  - Inventory is restored (sardines +2, C2 +1)
  - Daily Sales Summary recalculates (revenue, profit, transactions all adjust)
  - Voided sale shows as ❌ VOIDED in the list
- No → stays on screen

**Business Logic:**
- Only today's sales can be voided (can't void yesterday's sales — prevents misuse). Past days' sales are view-only.
- [◀] goes to the previous day, [▶] goes to the next day (disabled if already on today)
- **30-day visibility (free tier):** Only the last 30 days of sales history are browsable. Older history becomes visible on Premium.
- Voided sales are excluded from Daily Sales Summary calculations
- Voided sales remain visible in the history for transparency
- Sale numbers are generated sequentially per store per day, starting from #1 each day. For example, the first sale of the day is Sale #1, the next is Sale #2, etc. The sequence resets at the start of each new day.

---

## 13. Reports Tab

**Purpose:** Central hub for all tracking/reporting features.

```
┌─────────────────────────────┐
│ ←  Reports                  │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 📊 Daily Sales Summary  │ │
│ │ Today's revenue: ₱2,350 │ │
│ │ Today's profit: ₱680    │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📦 Inventory            │ │
│ │ ⚠ 3 items low stock     │ │
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 🧾 Sales History        │ │
│ │ 32 sales today          │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Layout:**
- Tappable cards that link to each reporting screen
- Each card shows a live preview of current data: Daily Sales Summary shows today's revenue and profit, Inventory shows the count of low-stock products (or "All stock levels OK" if none), and Sales History shows the number of sales today. While the data is loading, each card shows a pulsing placeholder line that is replaced by the actual value once ready.
- Cards: Daily Sales Summary, Inventory, Sales History

**Interaction:**
- Tap a card → navigates to that screen

---

## 14. More Menu

**Purpose:** Access to less-frequently used features and settings.

```
┌─────────────────────────────┐
│ ←  More                     │
├─────────────────────────────┤
│                             │
│ ┌─────────────────────────┐ │
│ │ 💰 Quick Price Adjust   │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👤 Account Settings     │ │
│ │    Store name, email    │ │
│ │    (from Google)        │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🚪 Logout               │ │
│ └─────────────────────────┘ │
│                             │
├─────────────────────────────┤
│ 🏪Sell  📦Products  📊Reports│
│         💰Expenses  ⋯More  │
└─────────────────────────────┘
```

**Interaction — Logout:**
- Tap [Logout] → confirmation dialog: "Are you sure you want to logout?" with Yes/No
- Yes → clears session, cart is cleared, returns to Login Screen
- No → stays on More Menu

---

## 15. Account Settings Screen

**Purpose:** Owner views and manages their account and store details.

```
┌─────────────────────────────┐
│ ←  Account Settings         │
├─────────────────────────────┤
│                             │
│  Display Name               │
│  ┌───────────────────────┐  │
│  │ Maria Santos           │  │
│  └───────────────────────┘  │
│  (read-only, from Google)   │
│                             │
│  Email (from Google)        │
│  ┌───────────────────────┐  │
│  │ maria@gmail.com       │  │
│  └───────────────────────┘  │
│  (read-only)                │
│                             │
│  Store Name                 │
│  ┌───────────────────────┐  │
│  │ Aling Maria Sari-Sari │  │
│  │ Store                  │  │
│  └───────────────────────┘  │
│                             │
│  [     Save Changes     ]   │
│                             │
└─────────────────────────────┘
```

**Fields:**
- Display Name (read-only) — from Google account (MSAL token), displayed for reference
- Email (read-only) — from Google account, displayed for reference
- Store Name (editable) — the name entered during Store Setup, can be changed anytime

**Interaction — Save Changes:**
- Updates the store name
- Confirmation: "Store name updated!"

---

## Navigation Summary (Bottom Nav)

| Tab | Screen | Purpose |
|---|---|---|
| 🏪 **Sell** | Main Selling Screen | Tap products, build cart, complete sales |
| 📦 **Products** | Product Management | Add/edit/delete products, categories, favorites |
| 📊 **Reports** | Reports Hub | Daily summary, inventory, sales history |
| 💰 **Expenses** | Expense Logger | Log and view overhead expenses |
| ⋯ **More** | More Menu | Quick price adjust, account settings, logout |

**Tooltips:** Key interactive elements throughout the app — buttons, icons, cards, toggles — have descriptive tooltips that appear on hover (desktop) or long-press (mobile). These provide contextual guidance without cluttering the UI.

---

## Key UI Flow Diagrams

### Flow 1: Making a Sale
```
Main Selling Screen
    │
    ├── Tap product button → Item added to cart (qty: 1)
    ├── Tap same product again → qty increases (+1)
    ├── Tap different product → added to cart
    ├── Tap 🔍 → search → tap result → added to cart
    │
    └── Tap Cart Bar
            │
            └── Cart Panel opens
                    │
                    ├── Adjust qty with [-] [+]
                    ├── [Remove] item
                    ├── [Clear Cart] → confirm → empty cart
                    │
                    └── [Complete Sale]
                            │
                            └── Sale recorded immediately
                                Inventory deducted
                                Cart cleared
                                Success snackbar: "Sale completed!"
                                → Back to Selling Screen
```

### Flow 2: Voiding a Completed Sale
```
Reports Tab → Sales History
    │
    └── Find the sale → Tap [Void Sale]
            │
            └── Confirm dialog
                    │
                    ├── Yes → Sale marked as VOIDED
                    │         Inventory restored
                    │         Daily summary recalculated
                    │
                    └── No → Stay on Sales History
```

### Flow 3: Adding a New Product
```
Products Tab → Tap [+ Add]
    │
    └── Add Product Screen
            │
            ├── Fill: name, selling price, cost price, quantity
            ├── Optional: low-stock threshold, category, favorite
            │
            └── [Save Product]
                    │
                    └── Product appears in selling grid immediately
                        → Back to Product Management
```

### Flow 4: Restocking
```
Reports Tab → Inventory
    │
    ├── See low-stock items highlighted
    │
    └── Tap [+ Restock] on a product
            │
            └── Dialog: "Add how many?"
                    │
                    ├── Enter quantity → Save
                    │   Stock updated
                    │   Optionally update cost price
                    │
                    └── Cancel
```

### Flow 5: Logging an Expense
```
Expenses Tab → Tap [+ Add]
    │
    └── Add Expense dialog
            │
            ├── Fill: description, amount, date (defaults today)
            │
            └── [Save]
                    │
                    └── Expense recorded
                        Daily summary profit recalculated
                        → Back to Expense list
```

### Flow 6: Adjusting Prices in Bulk
```
More Tab → Quick Price Adjust
    │
    ├── Select products (checkbox)
    ├── Choose: increase/decrease/set selling price
    ├── Choose: increase/decrease/set cost price
    │
    └── [Preview Changes]
            │
            └── Review before/after prices
                    │
                    ├── [Apply Changes] → Prices updated
                    │   Selling grid reflects new prices
                    │
                    └── [Cancel] → No changes
```
