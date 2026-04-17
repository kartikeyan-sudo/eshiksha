# 🚀 EShikhsha — Modern Ebook Platform 📚

> A full-stack ebook marketplace + reader platform
> Built for performance, scalability, and real-world usage.

---

## 🌟 Overview

**EShikhsha** is a modern ebook platform where users can:

* 📚 Discover and explore ebooks
* 🔍 Search & filter by categories
* 👀 Preview content before buying
* 💳 Purchase securely via Razorpay
* 📖 Read ebooks directly in browser
* 📦 Manage orders and library

It also includes a **powerful admin panel** to manage content, users, and transactions.

---

## ⚡ Key Features

### 👨‍🎓 User Features

* 🔐 Authentication (JWT + Google-ready)
* 📚 Ebook browsing with categories
* 🔍 Smart search & filters
* 📖 PDF reader (preview + full access)
* 💳 Razorpay payment integration
* 📦 Orders & purchase history
* 📚 Personal library
* 🔖 Bookmarks & reading progress (API ready)

---

### 👑 Admin Features

* 🛡️ Secure admin login (`/admin`)
* 📊 Dashboard with stats
* 💰 Recent transactions (revenue tracking)
* 📚 Ebook upload & management
* 🏷️ Category management
* 👥 User management (block/unblock)
* 📦 Order monitoring & status updates

---

## 🧱 Tech Stack

### 🌐 Frontend

* Next.js (App Router)
* React
* TypeScript
* Tailwind CSS

---

### ⚙️ Backend

* Node.js + Express
* PostgreSQL (`pg`)
* JWT Authentication
* Multer (file uploads)
* AWS SDK (S3)

---

### ☁️ Infrastructure

* 🗄️ Database: Neon PostgreSQL
* 📦 Storage: AWS S3 (private bucket)
* 💳 Payments: Razorpay
* 🌍 Frontend Hosting: Vercel
* 🚀 Backend Hosting: Render

---

## 🏗️ Architecture

```text
Frontend (Next.js)
      │
      ▼
Backend (Express API)
      │
 ┌────┴─────┐
 ▼          ▼
PostgreSQL   AWS S3
(Neon)       (PDF Storage)
```

---

## 📁 Project Structure

```text
eshiksha/
├─ app/                # Next.js routes
├─ backend/            # Express server
├─ components/         # UI components
├─ lib/                # Utilities & API client
├─ public/             # Static assets
└─ env files           # Configurations
```

---

## 🔐 Environment Setup

### Frontend (`.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key
```

---

### Backend (`backend/.env`)

```env
DATABASE_URL=your_neon_db
JWT_SECRET=your_secret

AWS_BUCKET_NAME=ebook-eshiksha

RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
```

---

## 🛠️ Local Development

### Install dependencies

```bash
npm install
npm --prefix backend install
```

### Run frontend

```bash
npm run dev
```

### Run backend

```bash
npm run backend:dev
```

---

## 💳 Payment Flow

```text
User clicks Buy
   ↓
Backend creates order
   ↓
Razorpay checkout opens
   ↓
Payment success
   ↓
Backend verifies
   ↓
Access unlocked
```

---

## 🔐 Security

* 🔒 Private S3 bucket
* 🔑 Signed URLs for PDF access
* 🛡️ JWT authentication
* 🚫 Admin route protection

---

## 📦 Core Modules

| Module     | Description           |
| ---------- | --------------------- |
| Auth       | User & Admin login    |
| Ebook      | Upload, view, preview |
| Orders     | Purchase tracking     |
| Categories | Classification        |
| Payments   | Razorpay integration  |
| Reader     | PDF viewer            |

---

## 🚀 Deployment

### Frontend (Vercel)

* Connect repo
* Add env variables
* Deploy

---

### Backend (Render)

* Root: `backend`
* Start: `npm run start`
* Add env variables

---

## 🧪 Testing Checklist

* ✅ Auth works
* ✅ Ebook upload works
* ✅ S3 integration works
* ✅ Payment flow works
* ✅ Admin dashboard loads
* ✅ Orders tracked
* ✅ PDF preview works

---

## 🧠 Upgrade Guide

When upgrading:

1. Update frontend first
2. Then backend
3. Test payment flow
4. Test PDF access
5. Validate DB migrations

---

## ⚠️ Troubleshooting

### Backend not working?

* Check `DATABASE_URL`
* Check CORS

---

### Payment issues?

* Verify Razorpay keys

---

### PDF not loading?

* Check signed URL + CORS

---

## 🤝 Contributing

* Keep PRs clean
* Don’t commit secrets
* Update docs when needed

---

## 💡 Vision

> This is not just a project —
> it’s a **scalable digital content platform**.

---

## 🔥 Built With Focus. Shipped With Care.
