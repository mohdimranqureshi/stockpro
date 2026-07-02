# 🏍️ StockPro — Dealership Management System

Full-stack production application: **Spring Boot 3 + React 18 + PostgreSQL**  
Single deployable JAR that serves both the REST API and React frontend.

---

## 📁 Project Structure

```
stockpro/
├── src/                          ← Spring Boot backend
│   └── main/java/com/stockpro/
│       ├── controller/           ← REST controllers (Auth, Stock, Transactions, Payments, Replacements, Scrap, Dashboard)
│       ├── service/impl/         ← Business logic services
│       ├── repository/           ← Spring Data JPA repositories
│       ├── entity/               ← JPA entities + enums
│       ├── dto/                  ← Request & Response DTOs
│       ├── security/             ← JWT filter + JwtService
│       ├── config/               ← Security, CORS, OpenAPI, Auditing
│       └── exception/            ← Global exception handler + custom exceptions
│
├── src/main/resources/
│   ├── application.yml           ← App config (dev/test profiles)
│   └── db/migration/V1__init_schema.sql  ← Flyway schema
│
├── frontend/                     ← React 18 + Vite + Tailwind
│   ├── src/
│   │   ├── pages/                ← Dashboard, Stock, Transactions, Payments, Replacements, Scrap, Reports
│   │   ├── components/           ← Layout, UI components (Modal, Badge, Table, StatCard, etc.)
│   │   ├── lib/api.js            ← Axios client + all API helpers
│   │   └── store/authStore.js    ← Zustand auth state
│   └── vite.config.js            ← Proxies /api → Spring Boot in dev
│
├── pom.xml                       ← Maven: builds React first, then packages into single JAR
├── Dockerfile                    ← Multi-stage Docker build
├── docker-compose.yml            ← App + PostgreSQL
└── .env.example                  ← Environment template
```

---

## 🚀 Quick Start

### Prerequisites
- Java 21
- Maven 3.9+
- Node.js 20+
- PostgreSQL 15+ (or Docker)

### 1. Clone & configure

```bash
git clone <repo>
cd stockpro
cp .env.example .env
# Edit .env with your DB password and JWT secret
```

### 2. Run with Docker (recommended)

```bash
docker compose up --build
```

App will be live at **http://localhost:8080**

---

### 3. Run locally (dev mode)

**Start PostgreSQL:**
```bash
docker run -d --name pg \
  -e POSTGRES_DB=stockpro \
  -e POSTGRES_USER=stockpro \
  -e POSTGRES_PASSWORD=secret \
  -p 5432:5432 postgres:16-alpine
```

**Start Spring Boot backend:**
```bash
export DB_PASSWORD=secret
export JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Start React frontend (separate terminal):**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173 (proxies API to :8080)
```

---

### 4. Build production JAR

```bash
mvn clean package -DskipTests
java -jar target/stockpro-1.0.0.jar
```

The JAR serves React from `/` and the API from `/api/**`.

---

## 🔑 Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@stockpro.com | Admin@123 | ADMIN |

---

## 📡 API Endpoints

| Module | Base URL |
|--------|----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register` |
| Dashboard | `GET /api/dashboard/summary` |
| Stock | `GET/POST/PUT/DELETE /api/stock` |
| Transactions | `GET/POST /api/transactions` |
| Payments | `GET/POST/DELETE /api/payments` |
| Replacements | `GET/POST/DELETE /api/replacements` |
| Scrap | `GET/POST/PUT/DELETE /api/scrap` |
| P&L | `GET /api/transactions/profit-loss/monthly` |

**Swagger UI:** http://localhost:8080/swagger-ui.html  
**Health check:** http://localhost:8080/actuator/health

---

## 🛡️ Security

- JWT Bearer token authentication (24hr access, 7-day refresh)
- BCrypt password encoding (strength 12)
- Role-based access: `ADMIN`, `MANAGER`, `STAFF`
- ADMIN required for DELETE operations and user management
- CORS configured via `CORS_ORIGINS` env variable

---

## 🗄️ Database

Flyway manages schema migrations automatically on startup.  
Migration files: `src/main/resources/db/migration/`

---

## 🌐 Features

| Feature | Details |
|---------|---------|
| **Stock** | Model, S.No., Rate, Warranty, Color, Variant, Engine/Chassis No., HSN Code |
| **Sales & Purchases** | Date/month/year filters, Invoice, GST, Discount, Auto-updates stock status |
| **Payments** | Inflow/Outflow, UPI/Cash/Bank/Cheque/EMI/Card, Reference tracking |
| **Replacements** | Given & received vehicle tracking, Difference amount |
| **Scrap** | Tagged for sale, Sold, Pending evaluation, Dismantled statuses |
| **P&L Reports** | Monthly charts (Bar + Line), Year selector, Margin % |
| **Dashboard** | Live KPIs, Recent transactions, Monthly P&L chart |
