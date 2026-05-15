# Requirements: UPI Payment Integration

## 1. Admin Settings & Configuration
- **Payment Method Toggle**: A setting in the admin dashboard to switch between "Razorpay" and "UPI Only".
- **UPI ID Configuration**: If "UPI Only" is selected, an input field to store the Admin's UPI ID (e.g., `admin@upi`).
- **Persistence**: These settings must be stored in the `settings` table in the database.

## 2. Admin Order Management
- **Payment Tags**: Orders in the admin dashboard should clearly show if they were paid via Razorpay or UPI.
- **Verification UI**: For UPI orders (status: `payment_review`), show:
  - Submitted UTR Number.
  - "Verify & Mark as Delivered" button.
- **Order Fulfillment**: Marking an order as verified should change status to `completed` and trigger "delivery" (granting user access to the ebook).

## 3. User Purchase Flow (UPI Mode)
- **Payment Selection**: If Admin has enabled "UPI Only", the purchase button leads to a UPI payment page.
- **QR Code Generation**: Display a UPI QR code pre-filled with:
  - Admin's UPI ID.
  - Ebook's price (fixed amount).
  - Transaction note (optional).
- **Session Timer**: A visible 10-minute countdown timer. If it expires, the session is invalidated/closed.
- **UTR Submission**: An input field for the user to enter the 12-digit UTR number after making the payment.
- **Post-Submission State**: Show a popup/message: "Soon the payment will be verified by the team and your ebook will be delivered to you!".
- **Purchase Status**: The purchase record should be created with status `payment_review`.

## 4. Database Changes
- **Settings Table**: Ensure `payment_method` and `admin_upi_id` can be stored.
- **Payment Transactions Table**: Add `utr_number` column.
- **Purchases Table**: Ensure `status` values include `payment_review`.

## 5. Branching & Merging
- Work on `feature/upi-payment-integration`.
- Merge to `main` upon completion.
