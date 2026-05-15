# Roadmap: UPI Payment Integration

## Milestone 1: Core UPI Infrastructure & Admin Controls
- **Phase 1: Backend Infrastructure & Settings**
  - Update DB schema (add UTR column, settings keys).
  - Implement settings API (get/update payment mode and UPI ID).
  - Update purchase API to handle UPI mode and status.
- **Phase 2: Admin Dashboard Enhancements**
  - Create Admin Settings page for payment configuration.
  - Update Orders table with payment tags and verification UI.
  - Implement "Verify" action for UPI orders.

## Milestone 2: User-Side UPI Flow
- **Phase 3: User Payment Interface**
  - Implement UPI Payment page with QR code and timer.
  - Add UTR submission logic and post-payment success view.
  - Integrate UPI flow into the Ebook Detail view.

## Milestone 3: Verification & Polish
- **Phase 4: Testing & Merge**
  - End-to-end testing of UPI flow.
  - Final UI/UX polish.
  - Merge `feature/upi-payment-integration` into `main`.

## Milestone 4: Premium UI Redesign (Cinematic & Modern)
- **Phase 5: Global Design System & Core Assets**
  - Implement matte black theme and glassmorphism tokens in CSS.
  - Create high-end hero and ebook cover assets.
  - Implement Zepto-style splash/loading screen.
- **Phase 6: Landing Page & Component Overhaul**
  - Redesign Hero, Featured Series, and Why Choose Us sections.
  - Update EbookCard and Detail views with category-based accent themes.
  - Implement User Transformation and Pricing sections.
- **Phase 7: Advanced Reader & Mobile Optimization**
  - Redesign the ebook reading interface (Netflix/Kindle style).
  - Optimize all views for mobile-first/app-like experience.
  - Polish animations for speed and smoothness.
