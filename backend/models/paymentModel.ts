/**
 * Maxora Bangladesh (maxorabd.com) - UddoktaPay Payment Data Model & SQL Queries
 * Target Databases: PostgreSQL, MySQL 8+, SQLite, Cloud Firestore, JSON DB
 */

export interface UddoktaPayChargeRequest {
  full_name: string;
  email: string;
  amount: string | number;
  metadata?: {
    order_id?: string;
    order_number?: string;
    customer_phone?: string;
    customer_id?: string;
    [key: string]: any;
  };
  redirect_url: string;
  return_type?: 'GET' | 'POST';
  cancel_url: string;
  webhook_url?: string;
}

export interface UddoktaPayChargeResponse {
  status: boolean;
  message?: string;
  payment_url?: string;
  invoice_id?: string;
}

export interface UddoktaPayVerifyResponse {
  status: 'COMPLETED' | 'PENDING' | 'ERROR' | string;
  invoice_id: string;
  transaction_id?: string;
  amount: string | number;
  fee?: string | number;
  charged_amount?: string | number;
  payment_method?: string; // bkash, nagad, rocket, card, etc.
  sender_number?: string;
  date?: string;
  metadata?: {
    order_id?: string;
    order_number?: string;
    customer_phone?: string;
    [key: string]: any;
  };
}

export type PaymentStatus = 'Pending' | 'Paid' | 'Failed' | 'Refunded';

/**
 * Standard SQL Queries for PostgreSQL / MySQL / SQLite
 * Required by E-commerce Database specifications
 */
export const SQL_QUERIES = {
  // Query 1: Update payment status to Paid upon successful verification
  UPDATE_PAYMENT_SUCCESS: `
    UPDATE orders
    SET 
      payment_status = 'Paid',
      transaction_id = $1,
      payment_method = $2,
      order_status = CASE WHEN order_status = 'Pending' THEN 'Confirmed' ELSE order_status END,
      status = CASE WHEN status = 'Pending' THEN 'Confirmed' ELSE status END,
      payment_details = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4 OR order_number = $4;
  `,

  // Query 2: Update payment status to Failed upon cancellation or gateway failure
  UPDATE_PAYMENT_FAILED: `
    UPDATE orders
    SET 
      payment_status = 'Failed',
      payment_details = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2 OR order_number = $2;
  `,

  // Query 3: Select order by ID or order_number for payment processing
  SELECT_ORDER_BY_IDENTIFIER: `
    SELECT * FROM orders 
    WHERE id = $1 OR order_number = $1
    LIMIT 1;
  `,

  // Query 4: Select order by transaction_id
  SELECT_ORDER_BY_TRANSACTION_ID: `
    SELECT * FROM orders 
    WHERE transaction_id = $1
    LIMIT 1;
  `
};
