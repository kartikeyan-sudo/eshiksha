# System Architecture

## Overview
EShikhsha is a full-stack ebook platform with a Next.js frontend and an Express.js backend.

## Frontend Structure
- **App Router**: Uses Next.js `app` directory for routing.
- **Components**: Reusable UI components in `components/`.
- **Lib**: API clients and utility functions in `lib/`.
- **Admin Section**: Dedicated routes under `/admin` for management.

## Backend Structure
- **Routes**: API endpoints defined in `src/routes/`.
- **Middleware**: Auth and error handling in `src/middleware/` and `src/utils/`.
- **DB**: Database connection and initialization in `src/db/`.
- **Config**: Environment variables in `src/config/`.

## Data Flow
1. User browses ebooks (Frontend -> API -> DB).
2. User initiates purchase (Frontend -> API -> Razorpay -> API -> DB).
3. Admin manages content (Frontend -> API -> DB/S3).
