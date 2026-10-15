-- ====================================================================
-- MAXORA BANGLADESH (maxorabd.com) - UDDOKTAPAY DATABASE MIGRATION
-- Table: `orders` (PostgreSQL, MySQL 8+, SQLite, Cloud SQL)
-- Purpose: Adds payment_status, transaction_id, payment_gateway, and payment_details
-- ====================================================================

-- 1. POSTGRESQL / SUPABASE / CLOUD SQL
-- ====================================================================
DO $$
BEGIN
    -- Add payment_status column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_status'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT 'Pending';
    END IF;

    -- Add transaction_id column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(100);
    END IF;

    -- Add payment_gateway column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_gateway'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_gateway VARCHAR(50) DEFAULT 'cod';
    END IF;

    -- Add payment_details JSON column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'payment_details'
    ) THEN
        ALTER TABLE orders ADD COLUMN payment_details JSONB;
    END IF;
END $$;

-- Create Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- ====================================================================
-- 2. MYSQL 8+ COMPATIBLE ALTER QUERIES
-- ====================================================================
-- Run the following if connecting to MySQL / MariaDB:
-- ALTER TABLE `orders` 
--   ADD COLUMN IF NOT EXISTS `payment_status` VARCHAR(50) DEFAULT 'Pending',
--   ADD COLUMN IF NOT EXISTS `transaction_id` VARCHAR(100) NULL,
--   ADD COLUMN IF NOT EXISTS `payment_gateway` VARCHAR(50) DEFAULT 'cod',
--   ADD COLUMN IF NOT EXISTS `payment_details` JSON NULL,
--   ADD INDEX `idx_orders_payment_status` (`payment_status`),
--   ADD INDEX `idx_orders_transaction_id` (`transaction_id`);

-- ====================================================================
-- 3. AUTOMATED PARAMETERIZED QUERIES FOR UDDOKTAPAY CONTROLLER
-- ====================================================================

-- Query A: Payment Success Callback / Webhook (Automated Query)
-- Parameters:
--   $1: transaction_id (e.g. 'BKA12345678')
--   $2: payment_method (e.g. 'Online Payment (bKash - UddoktaPay)')
--   $3: payment_details (JSON string of verification response)
--   $4: order_id OR order_number
/*
UPDATE orders
SET 
    payment_status = 'Paid',
    transaction_id = $1,
    payment_method = $2,
    order_status = 'Confirmed',
    status = 'Confirmed',
    payment_details = $3,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $4 OR order_number = $4;
*/

-- Query B: Payment Failed / Cancelled Callback (Automated Query)
-- Parameters:
--   $1: payment_details (JSON string of cancellation / error reason)
--   $2: order_id OR order_number
/*
UPDATE orders
SET 
    payment_status = 'Failed',
    payment_details = $1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $2 OR order_number = $2;
*/
