# Project: EShikhsha - UPI Payment Integration

## What This Is
EShikhsha is a premium ebook platform. This project aims to integrate a manual UPI payment method as an alternative to Razorpay, providing admins with a way to switch between them and verify manual payments.

## Core Value
Provides flexibility in payment methods, especially for regions where UPI is preferred and manual verification is acceptable for lower overhead.

## Requirements

### Validated
- ✓ Razorpay payment integration
- ✓ Ebook upload and preview
- ✓ User authentication and access control
- ✓ Admin dashboard for orders and users

### Active
- [ ] Admin: Switch between Razorpay and UPI payment methods.
- [ ] Admin: Store and manage UPI ID details.
- [ ] Admin: Mark orders with "Paid with UPI" or "Paid with Razorpay" tags.
- [ ] Admin: Manual verification of UPI payments via UTR number.
- [ ] User: Display UPI QR code with fixed amount if UPI mode is active.
- [ ] User: 10-minute session timer for UPI payments.
- [ ] User: Input field for UTR number submission.
- [ ] User: Success notification after UTR submission.

### Out of Scope
- Automated UPI verification (manual UTR check by admin is required).

## Key Decisions
| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manual UPI | Low cost, high accessibility in India | Pending |
| Manual Verification | Simpler implementation than automated UPI webhooks | Pending |

---
*Last updated: 2026-05-15 after initialization*
