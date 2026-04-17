# EShikhsha Backend

Express API for ebook uploads, secure preview/full PDF access, and purchases.

## 1) Environment

Create `backend/.env` from `backend/.env.example`:

```env
PORT=5000
DATABASE_URL=your_neon_db_url
JWT_SECRET=your_secret

AWS_REGION=ap-south-1
AWS_ACCESS_KEY=your_access_key
AWS_SECRET_KEY=your_secret_key
AWS_BUCKET_NAME=ebook-eshiksha

FRONTEND_ORIGIN=http://localhost:3000

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
RAZORPAY_CURRENCY=INR
```

## 2) Install

```bash
npm install
```

## 3) Run

```bash
npm run dev
```

## 4) Database tables

Tables are auto-created at startup. The SQL is also available in `backend/sql/schema.sql`.

## 5) API Summary

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin-login`
- `POST /api/ebooks/upload` (admin only)
- `GET /api/ebooks`
- `GET /api/ebooks/:id`
- `GET /api/ebooks/:id/access` (JWT required)
- `POST /api/purchase/:ebookId/create-order` (JWT required, paid flow)
- `POST /api/purchase/:ebookId/verify` (JWT required, paid flow)
- `POST /api/purchase/:ebookId` (JWT required, free ebooks only)
- `GET /api/library` (JWT required)

## 6) Admin account note

Admin login requires a user row with `role='admin'`.
Example SQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-admin-email@example.com';
```
