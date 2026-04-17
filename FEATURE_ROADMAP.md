# EShikhsha Feature Roadmap

This file tracks implementation status for the requested platform expansion.

## Phase 1 (Must Have)

- [x] Reading features: save progress, bookmarks, notes
- [x] Razorpay checkout flow (order creation + frontend checkout + signature verification)
- [x] Admin panel baseline
- [x] Categories + search

## Phase 2 (High Impact)

- [x] Ratings and reviews
- [x] Save progress
- [x] Admin analytics (expanded metrics + top sellers)
- [x] Trending books endpoint and UI section

## Phase 3 (Pro Level)

- [x] Notes
- [ ] Text highlights (selection persistence model pending)
- [ ] Coupons and discount application
- [ ] PDF watermark by user identity
- [ ] Bundle pricing and bundled checkout

## Requested Feature Matrix

### 1) Smart Reader Features

- [x] Bookmark pages
- [x] Add notes
- [x] Save progress and resume page
- [x] Progress indicator in reader
- [ ] Persistent highlights with color and edit

### 2) Revenue Optimization

- [x] Free + paid ebooks (is_free)
- [ ] Coupons
- [ ] Bundle system
- [x] Razorpay order/capture flow

### 3) Admin Intelligence

- [x] Dashboard metrics: users, active users, purchases, revenue, conversion
- [x] Top-selling ebooks list
- [x] Trending books API
- [ ] Time-series revenue graph
- [ ] Drop-off analytics pipeline

### 4) Discovery

- [x] Search by title/description/tags
- [x] Category filter
- [x] Tags model + UI
- [x] Ratings shown on detail page
- [ ] Related books recommendation

### 5) Engagement

- [ ] Email notifications
- [ ] In-app notifications

### 6) Library Upgrade

- [ ] Collections/playlists
- [ ] Search inside book text index

### 7) Security

- [ ] Watermark PDF pages per user
- [ ] Device limit (max 2 devices)
- [ ] Disable right-click/download hardening

### 8) Performance

- [ ] API/cache layer for catalog/categories
- [ ] CDN strategy (CloudFront + S3)

### 9) UX

- [x] Theme toggle and reader dark mode support
- [x] Mobile-responsive reader/layout baseline
- [x] EmbedPDF-based preview section
- [ ] Hover quick preview cards on desktop

### 10) Growth

- [ ] Affiliate system
- [ ] SEO landing pages per book
