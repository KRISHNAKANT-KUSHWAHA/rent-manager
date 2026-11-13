# RoomRent Manager — Owner-Only Room Rental Management System

[![Node.js](https://img.shields.io/badge/Node.js-v22.19-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8.0-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![PDFKit](https://img.shields.io/badge/PDF_Generation-PDFKit-red)](https://pdfkit.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

A complete, production-ready full-stack web application designed exclusively for a **property owner** managing the rental rooms of a **single residential house** (e.g., *Shanti Niwas*).

---

## 📌 Strict System Scope & Core Principles

> [!IMPORTANT]
> - **Owner-Only Portal:** Exclusively for property owner administration. There is **NO tenant login**, **NO customer portal**, and **NO public listing/booking system**.
> - **Single Residential House:** Manages individual rooms within **one single house**, not a commercial multi-property complex or hotel.
> - **Individual Room Tenancy:** Rooms are leased separately to distinct tenants.
> - **Permanent Financial Accounting:** Historical rent invoices, payments, meter readings, and agreement records are **never deleted** when a tenant vacates.

---

## 🚀 Key Modules & Capabilities

### 1. Owner Authentication & Security
- Owner authentication via email and password using **bcrypt** (salt rounds = 10).
- **JWT tokens** delivered via **HTTP-only secure cookies** with optional Bearer header fallback.
- Rate limiting on authentication routes (15 min window, 30 max attempts).
- Audit logging for sensitive administrative operations.
- Owner profile and house configuration management (House name, address, default electricity rate, UPI ID).

### 2. Live Analytics Dashboard
- **8 Metric KPI Cards** calculated in real time from MongoDB:
  - *Total Rooms*, *Occupied Rooms*, *Available Rooms*, *Active Tenants*, *Expected Monthly Rent*, *Rent Received This Month*, *Total Pending Rent*, and *Pending Electricity Charges*.
- **Interactive Financial Chart** using Recharts (6-month comparative bar chart of rent, electricity, and expenses).
- Room occupancy status list.
- Recent rent receipts with one-click PDF downloads.
- Upcoming rent dues table and urgent overdue payment notices.
- Smart notification alerts (expiring agreements, missing identity documents, overdue utility bills).

### 3. Room Management
- Manage rooms with: Room number, floor level, monthly rent, security deposit, sub-meter number, billing type (`submeter`, `fixed`, `shared`), amenities, and notes.
- Visual room cards with real-time occupancy status badges (`Available`, `Occupied`, `Maintenance`).
- Deep inspection modal displaying currently assigned tenant details and complete previous tenant history.
- Safety enforcement: Prevents duplicate active rental agreements for the same room.

### 4. Comprehensive Tenant Management
- **Personal Details:** Full name, father's name, husband's name, date of birth, gender, occupation, employer/college, permanent address, primary and alternate mobile numbers.
- **Family & Emergency:** Emergency contact name, phone number, and relation.
- **Identity Information:** Masked Aadhaar (`XXXX-XXXX-1234`), Voter ID, PAN number.
- **Tenancy Lifecycle:** Automatic room occupancy assignment and move-out/vacating workflow with deposit refund settlement tracking.
- **Tenant Detail Profile:** Centralized view of documents, active agreements, contact details, and tenant photo upload.

### 5. Private Document Repository
- Dedicated document management module supporting:
  - Aadhaar Card, Voter ID, PAN Card, Passport Photograph, Address Proof, Rental Agreement, and Police Verification.
  - File formats supported: PDF, JPG, PNG, WEBP (up to 10 MB).
- **Private Stream Access:** Files are stored outside public web roots and accessed only through authenticated owner endpoints (`/api/documents/:id/view` and `/api/documents/:id/download`).

### 6. Rental Agreement Management
- Unique contract identification (e.g., `AGR-101-2026`).
- Tracks tenancy dates, monthly rent, security deposit, rent due day, and standard clauses.
- **One-Click Renewal Workflow:** Extends contract periods and records rent revisions without altering historical invoices.
- **Deposit Refund Tracking:** Records refund amounts, deductions, deduction reasons, and UPI/NEFT transaction references.
- **Printable Agreement PDF:** System generates formal rental agreements using **PDFKit**.

### 7. Core Rent Management
- **One-Click Monthly Invoicing:** Automatically generates monthly rent dues for all active rooms without creating duplicate invoices.
- **Payment Recording:** Supports full, partial, and advance payments across cash, UPI, bank transfer, and other methods.
- **Automatic Balance Calculation:** Carries forward previous unpaid balances into total dues.
- **Official Rent Receipts in PDF:** Generates PDF receipts including house header, tenant information, transaction reference, amount breakdown, and owner signature notice.

### 8. Independent Electricity Sub-Meter Management
- Each room is linked to its individual sub-meter.
- **Consumption Formula:**
  $$\text{Units Consumed} = \text{Current Reading} - \text{Previous Reading}$$
  $$\text{Electricity Charge} = \text{Units Consumed} \times \text{Rate per Unit}$$
- Prevents duplicate readings for the same room and billing month.
- Records meter photographs for verification.
- Generates electricity bills and records utility payments separately from room rent.
- Generates printable electricity sub-meter bills in PDF.

### 9. Property Maintenance & Expense Tracking
- Log house repair costs: *Plumbing, Electrical, Painting, Cleaning, Pest Control, Taxes, Renovation*.
- Link expenses to specific rooms or designate as common/whole-house expenses.
- Attach invoices and receipt photographs.

### 10. Individual Tenant Financial Ledger
- Comprehensive accounting ledger for every tenant (active and vacated).
- Displays running debit/credit timeline:
  - *Debits:* Rent invoices and electricity bills.
  - *Credits:* Rent payments and electricity payments.
- Real-time running balance calculation and security deposit balance summary.
- Month and year filtering.

### 11. Reports & Analytics
- Monthly and annual income statements.
- Room-wise revenue breakdown (rent vs. electricity vs. maintenance costs).
- Expense category distribution chart.
- **Data Export:** Export payments, bills, and expenses directly to CSV.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, React Router 6, Tailwind CSS 3, Lucide React, Recharts |
| **Backend** | Node.js (v22), Express.js 4, Mongoose 8, Multer, PDFKit |
| **Database** | MongoDB 8 |
| **Security** | Bcrypt.js, JSON Web Tokens (JWT), HTTP-Only Cookies, Helmet, Rate Limiter |

---

## 📁 Project Directory Structure

```text
rent-manager/
├── .env.example                # Root environment template
├── .gitignore                  # Git ignore rules for node_modules, .env, and uploads
├── package.json                # Root package configuration
├── README.md                   # Complete documentation
│
├── server/                     # Express & MongoDB Backend
│   ├── .env.example            # Backend environment template
│   ├── package.json            # Server dependencies
│   ├── server.js               # Express application entry point
│   ├── config/
│   │   ├── db.js               # MongoDB connection handler
│   │   └── constants.js        # House defaults, status enums & categories
│   ├── models/                 # 14 Mongoose Schema Models
│   │   ├── User.js             # Owner credentials & house configuration
│   │   ├── Room.js             # Room specifications & occupancy status
│   │   ├── Tenant.js           # Personal, family & identity details
│   │   ├── TenantDocument.js   # Encrypted & private document references
│   │   ├── RentalAgreement.js  # Contract terms, renewals & deposit refunds
│   │   ├── RentInvoice.js      # Monthly rent dues & balances
│   │   ├── RentPayment.js      # Payment history & receipt tracking
│   │   ├── ElectricityMeter.js # Sub-meter configurations
│   │   ├── ElectricityReading.js# Monthly readings & units consumed
│   │   ├── ElectricityBill.js  # Generated electricity charges
│   │   ├── ElectricityPayment.js# Separate electricity receipts
│   │   ├── Expense.js          # Property repair & maintenance logs
│   │   ├── Notification.js     # Reminders & expiry alerts
│   │   └── AuditLog.js         # Security audit logging
│   ├── controllers/            # Controller business logic
│   ├── middleware/             # Auth, upload, and error handling
│   ├── routes/                 # RESTful route definitions
│   ├── services/
│   │   ├── pdfService.js       # PDFKit generator for receipts and agreements
│   │   └── auditService.js     # Administrative audit logger
│   ├── uploads/                # Private storage directories
│   │   ├── documents/          # Private tenant identity proofs
│   │   ├── photos/             # Tenant photographs
│   │   ├── meters/             # Sub-meter reading photographs
│   │   └── receipts/           # Expense receipts
│   └── utils/
│       └── seedData.js         # Comprehensive seeder script
│
└── client/                     # Vite + React + Tailwind CSS Frontend
    ├── index.html              # HTML entry point
    ├── vite.config.js          # Vite config & API proxying
    ├── tailwind.config.js      # Tailwind styling configuration
    ├── package.json            # Frontend dependencies
    └── src/
        ├── api/                # Axios API services
        ├── components/
        │   ├── common/         # Button, Input, Select, Modal, StatCard, Badge, etc.
        │   └── layout/         # Sidebar, Navbar, Layout, PageHeader
        ├── context/            # AuthContext, ToastContext
        ├── pages/              # 12 Modular page views
        └── utils/              # Currency formatters, date helpers, constants
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (v6 or higher running locally or MongoDB Atlas)

### 2. Clone and Setup Environment
```bash
git clone https://github.com/your-username/rent-manager.git
cd rent-manager
```

Copy the environment templates:
```bash
cp .env.example server/.env
cp .env.example .env
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

### 4. Seed Realistic Initial Data
Populate the database with realistic rooms (4 rooms), tenants, rental agreements, rent invoices, payments, meter readings, and maintenance expenses:
```bash
npm run seed
```

### 5. Run the Application
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm run server
# Server starts on http://localhost:5100
```

**Terminal 2 (Frontend Client):**
```bash
npm run client
# Frontend starts on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🔑 Default Owner Credentials

When the database is seeded with `npm run seed`, the default owner credentials are:

| Field | Value |
|---|---|
| **Portal URL** | `http://localhost:5173/login` |
| **Email** | `owner@rentmanager.com` |
| **Password** | `Password123!` |
| **House Name** | `Shanti Niwas (Property #104)` |
| **Address** | `Plot 42, Green Avenue, Sector 15, Near City Park, Jaipur` |

*(You can click "Fill Default Owner Credentials" on the login screen for quick access).*

---

## 🔌 API Reference Overview

| Endpoint | Method | Description |
|---|---|---|
| `/api/auth/login` | `POST` | Owner login & cookie issuance |
| `/api/auth/me` | `GET` | Get authenticated owner details |
| `/api/auth/logout` | `POST` | Clear session cookie |
| `/api/rooms` | `GET`, `POST` | List and create rooms |
| `/api/rooms/:id` | `GET`, `PUT`, `DELETE` | Room details, edit, and deletion |
| `/api/tenants` | `GET`, `POST` | List and register tenants |
| `/api/tenants/:id` | `GET`, `PUT` | Tenant profile and update |
| `/api/tenants/:id/vacate` | `POST` | Vacate tenant and release room |
| `/api/documents/upload` | `POST` | Upload tenant identity document |
| `/api/documents/:id/view` | `GET` | Authenticated document preview stream |
| `/api/documents/:id/download` | `GET` | Authenticated document file download |
| `/api/agreements` | `GET`, `POST` | List and create rental agreements |
| `/api/agreements/:id/pdf` | `GET` | Download generated agreement PDF |
| `/api/agreements/:id/renew` | `POST` | Renew rental agreement |
| `/api/rent/generate-invoices` | `POST` | Auto-generate monthly rent invoices |
| `/api/rent/invoices` | `GET` | List rent invoices with filters |
| `/api/rent/payments` | `GET`, `POST` | Record payment & list payment history |
| `/api/rent/receipts/:id/pdf` | `GET` | Download official rent payment receipt PDF |
| `/api/electricity/readings` | `GET`, `POST` | Record meter reading & generate bill |
| `/api/electricity/bills` | `GET` | List electricity bills |
| `/api/electricity/payments` | `POST` | Record electricity utility payment |
| `/api/electricity/bills/:id/pdf` | `GET` | Download electricity bill receipt PDF |
| `/api/expenses` | `GET`, `POST`, `DELETE`| Log and manage property expenses |
| `/api/ledger/tenant/:id` | `GET` | Tenant financial ledger & running balance |
| `/api/dashboard/stats` | `GET` | Live real-time dashboard analytics |
| `/api/reports/analytics` | `GET` | Consolidated annual & monthly reports |
| `/api/reports/export-csv` | `GET` | Export rent, electricity, and expense CSVs |

---

## 📄 License
ISC © Property Owner Room Rental Management System.

