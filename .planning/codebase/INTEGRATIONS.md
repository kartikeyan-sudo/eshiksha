# External Integrations

## Payment Gateways
- **Razorpay**: Currently the primary payment gateway. Handles order creation and payment verification.

## Cloud Services
- **AWS S3**: Used for storing ebook files (`file_key`) and cover images (`cover_key`). Uses presigned URLs for secure access.

## Database
- **PostgreSQL**: Stores users, ebooks, purchases, transactions, reading progress, bookmarks, notes, and categories.
