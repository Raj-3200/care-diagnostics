# Care Diagnostics LIMS - Laboratory Information Management System

A comprehensive, production-ready backend API for managing laboratory operations including patient registration, test orders, sample tracking, result management, and reporting.

## 🚀 Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript (strict mode)
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL 15+
- **Authentication:** JWT (access + refresh tokens)
- **Password Hashing:** bcrypt
- **Validation:** Zod
- **Security:** Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- PostgreSQL 15+ database

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Guptajinx/care-digonistcs.git
cd care-digonistcs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration.

### 4. Database Setup

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database with default admin user
npm run prisma:seed
```

### 5. Run the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The API will be available at `http://localhost:4000/api/v1`

## 🔐 Default Admin Credentials

- **Email:** `admin@carediagnostics.com`
- **Password:** `Admin@123456`

⚠️ **IMPORTANT:** Change this password immediately in production!

## 📚 API Endpoints

### Health Check
- `GET /api/v1/health` - Check API and database health

### Authentication
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current user profile

### User Management (Admin Only)
- `POST /api/v1/users` - Create user
- `GET /api/v1/users` - List users (paginated)
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

## 📁 Project Structure

```
src/
├── config/          # Configuration files
├── middleware/      # Express middleware
├── modules/         # Feature modules
│   ├── auth/
│   ├── user/
│   └── health/
├── shared/          # Shared utilities
│   ├── types/
│   ├── errors/
│   ├── utils/
│   └── constants/
├── app.ts           # Express app
└── server.ts        # Server entry point

prisma/
├── schema.prisma    # Database schema
└── seed.ts          # Database seeding
```

## 🗄️ Database Schema

### Core Models
- **User** - System users
- **Patient** - Patient records with MRN
- **Visit** - Patient visits
- **Test** - Test catalog
- **TestOrder** - Ordered tests
- **Sample** - Sample tracking
- **Result** - Test results
- **Report** - Generated reports
- **Invoice** - Billing
- **AuditLog** - Audit trail

## 📝 License

MIT

---

**Built with ❤️ for Care Diagnostics**
