# TRADEAI Local Setup & Testing

## Running Locally

### Prerequisites
- Docker & Docker Compose (for MongoDB and Redis)
- Node.js 18+

### Start Infrastructure
```bash
# Start only MongoDB and Redis via Docker
docker compose up -d mongodb redis
```

### Backend Setup
The Docker backend service has env var issues. Run natively instead:
```bash
cd backend
npm install
# Set required env vars: NODE_ENV, PORT, MONGODB_URI, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, JWT_SECRET
# See backend/.env or docker-compose.yml for values
node src/server.js
```

Note: `docker-compose.yml` backend service needs `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` as separate env vars (not just `REDIS_URL`). The `validateEnv.js` requires these individually.

### Frontend Setup
```bash
cd frontend
npm install
# Override REACT_APP_API_URL to point to local backend
REACT_APP_API_URL=http://localhost:5002/api PORT=3000 npm start
```

Note: `frontend/.env.development` points to a remote workers.dev URL by default. Override with `REACT_APP_API_URL=http://localhost:5002/api` for local testing.

### Seed Database
```bash
# Run init-mongo.js through Docker MongoDB
docker exec -i tradeai-mongodb mongosh -u <MONGO_USER> -p <MONGO_PASSWORD> --authenticationDatabase admin tradeai < init-mongo.js
```

**Important**: After seeding, the bcrypt password hashes may not work. Re-hash passwords using bcryptjs and update all users in MongoDB with the correct hash.

## Test Credentials
Defined in `init-mongo.js`. Default accounts:
- admin@testcompany.demo (Admin role)
- manager@testcompany.demo (Manager role)
- kam@testcompany.demo (KAM role)
- analyst@testcompany.demo (Analyst role)
- user@testcompany.demo (Regular User role)
Password for all: defined in init-mongo.js seed script

## Seed Data
- 10 customers (Amazon, Best Buy, CVS, Costco, Home Depot, Kroger, Safeway, Target, Walgreens, Walmart)
- 20 products (all with R 0.00 prices - seed data issue)
- 1 budget with categories
- 10 promotions (all "Completed" status)
- 100 trade spend records
- 500 sales records

## Known Issues
1. **Tenant isolation blocks all write ops**: POST/PUT/DELETE return "Tenant context not found" because seed data users lack proper `tenantId`/`companyId` matching the tenant middleware. All CRUD create/update/delete operations fail.
2. **Trading Terms page crashes**: `TypeError: items.filter is not a function` - API returns object instead of array.
3. **Blank page after logout**: App shows blank page instead of redirecting to /login.
4. **Dashboard data loading stuck**: "Fetching dashboard data..." never resolves (tenant isolation).
5. **Trade Spends empty**: 100 seeded records not visible due to tenant filtering mismatch.

## Application Structure
- **Sidebar navigation groups**: Dashboard, Plan (6 items), Execute (3), Approve, Settle (5), Analyze (5), Data (6), Admin (5 - admin only)
- **Admin section**: Only visible to admin role users (RBAC works correctly)
- **Dashboard routing**: Admin/Manager -> ManagerDashboard, KAM -> CommandCenter
- **Frontend port**: 3000 (dev server)
- **Backend port**: 5002
- **MongoDB port**: 27017 (Docker)
- **Redis port**: 6379 (Docker)
