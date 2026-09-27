# Vishal Mega Mart - Online Grocery Shopping Web Application

A full-stack, responsive online grocery shopping web application built with **plain HTML5, CSS3, vanilla JavaScript (Tailwind CSS via CDN)** for the frontend and **Node.js, Express.js, MongoDB (Mongoose), JWT, and bcrypt** for the backend.

---

## Features

- **Brand Design**: Vishal Mega Mart signature red (`#DC2626`) & white color palette with warm amber accents. Clean UI with SVG icons and zero emojis.
- **No Framework Frontend**: Built using modern vanilla JavaScript with standard `fetch()` API and reactive state management via `localStorage`.
- **All 8 Complete Web Pages**:
  1. `index.html` - Homepage with hero banner, promotional offers, category browser, and featured grocery products grid.
  2. `products.html` - Full grocery catalog with instant category filtering, search input, and price/newest sorting.
  3. `product.html` - Single product view with zoom preview, stock badge, quantity controls, and similar category recommendations.
  4. `cart.html` - Interactive shopping cart with quantity stepper, dynamic subtotal, and automatic Free Delivery threshold calculation.
  5. `checkout.html` - Multi-step checkout with delivery address validation and payment method selection (Cash on Delivery, instant UPI, Credit/Debit Card).
  6. `orders.html` - Customer's past orders dashboard with order status tracking and item breakdown.
  7. `login.html` - Unified auth page with smooth tab toggle between Sign In and Registration.
  8. `admin.html` - Admin portal guarded by role authorization (`role === 'admin'`), featuring KPI metrics cards, add product form, category creation, product catalog table with edit modal & delete actions, and real-time order status management.
- **Secure Admin Registration**:
  - Administrator accounts cannot be created by arbitrary visitors.
  - Requires a secret **Admin Security Password** during registration (`ADMIN_SECURITY_KEY` in `.env`).
- **Backend Architecture**:
  - Modular Express MVC structure (`models`, `routes`, `controllers`, `middleware`, `config`).
  - Secure authentication with `bcryptjs` password hashing and `jsonwebtoken` (JWT).
  - Role-based authorization protecting customer and admin endpoints.
  - Automatic `MongoMemoryServer` fallback: If local MongoDB is not running, an embedded in-memory database launches and auto-seeds the grocery catalog.
  - Health check endpoint (`GET /health`) designed for Render or cloud keepalives.

---

## Project Structure

```
vishal-mega-mart/
├── package.json                 # Project manifest & npm scripts
├── README.md                    # Project documentation
├── server/
│   ├── .env                     # Environment variables (PORT, MONGO_URI, JWT_SECRET, ADMIN_SECURITY_KEY)
│   ├── .env.example             # Template for environment configuration
│   ├── server.js                # Express app entry point & static asset serving
│   ├── seed.js                  # Database catalog seed script
│   ├── test-api.js              # Automated backend API test suite
│   ├── test-client.js           # Automated frontend route verification
│   ├── config/
│   │   ├── db.js                # MongoDB connection handler with embedded memory fallback
│   │   └── seedHelper.js        # Seed catalog data (categories and products)
│   ├── models/
│   │   ├── User.js              # User schema { name, email, password, role }
│   │   ├── Category.js          # Category schema { name, image_url }
│   │   ├── Product.js           # Product schema { name, category_id, price, image_url, description, stock }
│   │   └── Order.js             # Order schema { customer_id, items, total, address, payment_method, status }
│   ├── middleware/
│   │   └── auth.js              # JWT verification & role authorization (verifyToken, requireAdmin)
│   ├── controllers/
│   │   ├── authController.js    # Register, login, user profile, admin security key check
│   │   ├── productController.js # CRUD, category filter, text search, sorting
│   │   ├── categoryController.js# Category listing and admin creation
│   │   └── orderController.js   # Order placement, customer orders, admin order manager
│   └── routes/
│       ├── authRoutes.js        # /api/auth
│       ├── productRoutes.js     # /api/products
│       ├── categoryRoutes.js    # /api/categories
│       └── orderRoutes.js       # /api/orders
└── client/
    ├── index.html               # 1. Homepage
    ├── products.html            # 2. All products catalog
    ├── product.html             # 3. Product detail page
    ├── cart.html                # 4. Shopping cart
    ├── checkout.html            # 5. Delivery address & payment
    ├── orders.html              # 6. Customer past orders
    ├── login.html               # 7. Login / Register toggle page
    ├── admin.html               # 8. Admin dashboard
    ├── css/
    │   └── styles.css           # Brand styles, toasts, custom scrollbars
    └── js/
        ├── api.js               # Common fetch helper, token management, cart state, toasts
        ├── navbar.js            # Responsive navbar & footer injector, cart badge
        ├── index.js             # Homepage category & product logic
        ├── products.js          # Catalog filtering, search, sorting
        ├── product.js           # Product details, quantity controls, add to cart
        ├── cart.js              # Cart management, item count, totals
        ├── checkout.js          # Form validation, payment toggles, order placement
        ├── orders.js            # Customer orders table & status badges
        ├── login.js             # Auth form tabs, JWT storage, redirects, admin key validation
        └── admin.js             # Admin metrics, CRUD operations, order status updater
```

---

## Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Variables

Configure `server/.env`:

```env
PORT=5050
MONGO_URI=mongodb://127.0.0.1:27017/vishal_mega_mart
JWT_SECRET=vishal_mega_mart_super_secret_jwt_key_2025
ADMIN_SECURITY_KEY=vmm_admin_secret_pass_2025
```

> **Note on MongoDB**:
> If MongoDB is not running locally, the application automatically launches an in-memory database and seeds the grocery catalog.

### 3. Start the Server

```bash
npm start
```

Or for development with watch mode:

```bash
npm run dev
```

Visit the website in your browser:
**`http://localhost:5050`**

---

## Account Registration & Admin Security

### Customer Signup
1. Open `http://localhost:5050/login.html`.
2. Click **New Account**.
3. Keep Account Role as **Customer (Buy Groceries)**.
4. Enter your name, email, and password to register.

### Administrator Signup
1. Open `http://localhost:5050/login.html`.
2. Click **New Account**.
3. Set Account Role to **Administrator (Manage Store & Inventory)**.
4. An **Admin Security Password** field will appear.
5. Enter the configured security key (`vmm_admin_secret_pass_2025` by default).
6. Click **Create Account** to gain access to the Admin Portal (`/admin.html`).

---

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register customer or admin (admin requires `adminSecurityKey`)
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Authenticated user details

### Products
- `GET /api/products` - List products (`?category=...`, `?search=...`, `?sort=...`, `?featured=true`)
- `GET /api/products/:id` - Single product details
- `POST /api/products` - Create new product (*Admin only*)
- `PUT /api/products/:id` - Update existing product (*Admin only*)
- `DELETE /api/products/:id` - Delete product (*Admin only*)

### Categories
- `GET /api/categories` - List all grocery categories
- `POST /api/categories` - Create new category (*Admin only*)

### Orders
- `POST /api/orders` - Place new order (*Customer*)
- `GET /api/orders/mine` - View authenticated customer's orders (*Customer*)
- `GET /api/orders` - View all store orders (*Admin only*)
- `PATCH /api/orders/:id/status` - Update order delivery status (*Admin only*)

### Health Check (Render keepalive)
- `GET /health` - Returns `{ status: "ok", uptime, timestamp, database }`

---

## Testing

Run backend automated verification (including admin security password tests):
```bash
npm test
```

Run frontend static route verification:
```bash
node server/test-client.js
```

---

## Deployment to Render

1. Push this repository to GitHub.
2. In Render, create a new **Web Service**.
3. Set build and start commands:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set Environment Variables in Render:
   - `PORT`: `5050`
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: A long random secret key
   - `ADMIN_SECURITY_KEY`: Your private administrator signup password
5. Keep your Render instance active by pinging `GET /health` every 10 minutes.
# vishal-mega-mart
