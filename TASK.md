# UPI Payment Integration for EShikhsha

Add a feature on the admin portal to switch between razorpay and upi payment method.

## Admin Features
- Switch to only UPI: Admin panel option to paste UPI ID details.
- Orders Section: Include tags for "paid with UPI" and "paid with Razorpay".
- UPI Verification: For UPI payments, provide "Verify" and "Mark as verified" options.
- Delivery: Once verified, the ebook should be delivered to the user.

## User Features
- UPI Selection: If UPI is selected, prompt user with UPI ID and fixed amount (set by admin for books).
- QR Generation: Generate QR code with fixed amount of the ebook.
- Session Timer: 10-minute timer before session termination.
- UTR Number: Ask for UTR number below the QR code.
- Post-Payment: After UTR submission, show popup "Soon the payment will be verified by the team and your ebook will be delivered to you!".

## Implementation Notes
- New branch `feature/upi-payment-integration`.
- Merge back to main after completion.
