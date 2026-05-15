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
