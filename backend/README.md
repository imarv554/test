Credify Backend API (TypeScript + Express + MongoDB)

Setup
- cd backend
- bun install
- cp .env.example .env and set MONGODB_URI, optional PORT and CORS_ORIGIN
- bun run dev

Build and start
- bun run build
- bun run start

Endpoints
- GET /api/health
- GET /api/products
- GET /api/products/:id
- POST /api/products
- PUT /api/products/:id
- DELETE /api/products/:id
- POST /api/orders
- GET /api/orders/:id
- GET /api/orders?email=you@example.com
- GET /api/orders?wallet=YOUR_WALLET
- POST /api/verify-payment { reference }

Frontend integration
- Vite dev proxy routes /api to http://localhost:4000
- Product catalog fetches from /api/products
- Card payment verification hits /api/verify-payment
- After successful payment, an order is created via /api/orders
