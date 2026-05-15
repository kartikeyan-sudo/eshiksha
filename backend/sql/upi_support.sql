-- UPI Support Migration
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS utr_number VARCHAR(50);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'razorpay';

-- Add settings for UPI
INSERT INTO settings (key, value) VALUES ('payment_mode', 'razorpay') ON CONFLICT (key) DO NOTHING;
INSERT INTO settings (key, value) VALUES ('admin_upi_id', '') ON CONFLICT (key) DO NOTHING;
