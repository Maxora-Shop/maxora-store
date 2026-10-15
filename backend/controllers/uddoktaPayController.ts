import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import {
  UddoktaPayChargeRequest,
  UddoktaPayChargeResponse,
  UddoktaPayVerifyResponse,
  SQL_QUERIES
} from '../models/paymentModel';

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

function getFirestoreInstance() {
  try {
    let firebaseConfig = DEFAULT_FIREBASE_CONFIG;
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      try {
        firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (e) {}
    }
    const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
      : getFirestore(fbApp);
  } catch (e) {
    return null;
  }
}

function cleanForFirestore(data: any): any {
  if (data === null || data === undefined) return '';
  if (Array.isArray(data)) return data.map(cleanForFirestore);
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== undefined) cleaned[k] = cleanForFirestore(v);
    }
    return cleaned;
  }
  return data;
}

// References to shared DB injected by server.ts
let sharedDb: any = null;
let saveDbFn: (() => void) | null = null;
let syncVersionsRef: Record<string, number> | null = null;

export function setSharedPaymentDb(db: any, saveFn: () => void, syncVersions?: Record<string, number>) {
  sharedDb = db;
  saveDbFn = saveFn;
  if (syncVersions) {
    syncVersionsRef = syncVersions;
  }
}

/**
 * Returns normalized UddoktaPay URLs and API Key
 */
function getUddoktaPayConfig() {
  // Sandbox API key fallback for seamless developer testing
  const apiKey = (process.env.UDDOKTAPAY_API_KEY || '982d381360a69d419689740d9f2e26ce36fb7a50').trim();
  let rawUrl = (process.env.UDDOKTAPAY_API_URL || 'https://sandbox.uddoktapay.com/api/checkout-v2').trim();

  // Strip trailing slashes
  rawUrl = rawUrl.replace(/\/+$/, '');

  let checkoutUrl = rawUrl;
  let baseUrl = rawUrl;

  if (rawUrl.includes('/api/checkout-v2')) {
    baseUrl = rawUrl.replace('/api/checkout-v2', '');
    checkoutUrl = rawUrl;
  } else if (rawUrl.includes('/api/checkout')) {
    baseUrl = rawUrl.replace('/api/checkout', '');
    checkoutUrl = `${baseUrl}/api/checkout-v2`;
  } else {
    baseUrl = rawUrl;
    checkoutUrl = `${baseUrl}/api/checkout-v2`;
  }

  const verifyUrl = `${baseUrl}/api/verify-payment`;

  return { apiKey, baseUrl, checkoutUrl, verifyUrl };
}

/**
 * Helper to determine the application's base public URL
 */
function getAppBaseUrl(req: Request): string {
  if (process.env.APP_URL && !process.env.APP_URL.includes('MY_APP_URL')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  return `${proto}://${host}`;
}

/**
 * Update order in Database and Firestore
 */
async function updateOrderInDatabase(
  orderIdentifier: string,
  updates: {
    payment_status: 'Paid' | 'Failed' | 'Pending';
    transaction_id?: string;
    payment_method?: string;
    status?: string;
    timeline_note?: string;
    payment_details?: any;
  }
) {
  let updatedOrder: any = null;

  if (sharedDb && Array.isArray(sharedDb.orders)) {
    const orderIdx = sharedDb.orders.findIndex(
      (o: any) =>
        o.id === orderIdentifier ||
        o.order_number === orderIdentifier ||
        (o.id && o.id.toLowerCase() === orderIdentifier.toLowerCase()) ||
        (o.order_number && o.order_number.toLowerCase() === orderIdentifier.toLowerCase())
    );

    if (orderIdx !== -1) {
      const existing = sharedDb.orders[orderIdx];
      existing.payment_status = updates.payment_status;
      if (updates.transaction_id) {
        existing.transaction_id = updates.transaction_id;
      }
      if (updates.payment_method) {
        existing.payment_method = updates.payment_method;
      }
      if (updates.status) {
        existing.status = updates.status;
        existing.order_status = updates.status;
      }
      if (updates.payment_details) {
        existing.payment_details = updates.payment_details;
      }
      existing.updated_at = new Date().toISOString();

      if (!Array.isArray(existing.timeline)) {
        existing.timeline = [];
      }

      if (updates.timeline_note) {
        existing.timeline.push({
          status: updates.status || existing.status,
          timestamp: new Date().toISOString(),
          note: updates.timeline_note,
          by: 'UddoktaPay Gateway'
        });
      }

      sharedDb.orders[orderIdx] = existing;
      updatedOrder = existing;

      if (saveDbFn) {
        saveDbFn();
      }

      if (syncVersionsRef) {
        syncVersionsRef.orders = Date.now();
      }
    }
  }

  // Update in Firestore
  try {
    const fsDb = getFirestoreInstance();
    if (fsDb && (updatedOrder || orderIdentifier)) {
      const orderDocId = updatedOrder ? updatedOrder.id : orderIdentifier;
      const fsPayload: any = {
        payment_status: updates.payment_status,
        updated_at: new Date().toISOString(),
      };
      if (updates.transaction_id) fsPayload.transaction_id = updates.transaction_id;
      if (updates.payment_method) fsPayload.payment_method = updates.payment_method;
      if (updates.status) {
        fsPayload.status = updates.status;
        fsPayload.order_status = updates.status;
      }
      if (updates.payment_details) fsPayload.payment_details = cleanForFirestore(updates.payment_details);
      if (updatedOrder?.timeline) fsPayload.timeline = cleanForFirestore(updatedOrder.timeline);

      await setDoc(doc(fsDb, 'orders', orderDocId), fsPayload, { merge: true });
      console.log(`[UDDOKTAPAY_FIRESTORE] Synchronized order ${orderDocId} with payment_status=${updates.payment_status}`);
    }
  } catch (fsErr) {
    console.error('[UDDOKTAPAY_FIRESTORE_ERROR] Failed to update Firestore order:', fsErr);
  }

  return updatedOrder;
}

/**
 * 1. POST /api/payment/uddoktapay/initiate
 * Initiates payment session with UddoktaPay
 */
export async function initiatePayment(req: Request, res: Response) {
  try {
    const { order_id, order_number, amount, customer_name, phone, email } = req.body || {};

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment amount. Amount must be greater than 0.'
      });
    }

    const { apiKey, checkoutUrl } = getUddoktaPayConfig();
    const appBaseUrl = getAppBaseUrl(req);

    const safeOrderNo = order_number || `MX-${Date.now().toString(36).toUpperCase()}`;
    const safeOrderId = order_id || `ord-${Date.now().toString(36)}`;
    const safeCustomerName = (customer_name || 'Customer').trim();
    const safePhone = (phone || '').replace(/[^0-9]/g, '');
    const safeEmail = (email && email.includes('@')) ? email.trim() : `${safePhone || 'customer'}@maxorabd.com`;

    // Construct UddoktaPay charge payload
    const payload: UddoktaPayChargeRequest = {
      full_name: safeCustomerName,
      email: safeEmail,
      amount: String(Math.round(Number(amount))),
      metadata: {
        order_id: safeOrderId,
        order_number: safeOrderNo,
        customer_phone: safePhone,
        store: 'Maxora Bangladesh (maxorabd.com)'
      },
      redirect_url: `${appBaseUrl}/api/payment/uddoktapay/success`,
      return_type: 'GET',
      cancel_url: `${appBaseUrl}/api/payment/uddoktapay/cancel?order_id=${encodeURIComponent(safeOrderId)}&order_number=${encodeURIComponent(safeOrderNo)}`,
      webhook_url: `${appBaseUrl}/api/payment/uddoktapay/webhook`
    };

    console.log(`[UDDOKTAPAY_INITIATE] Requesting checkout for order ${safeOrderNo} (${safeOrderId}) - Amount: ৳${amount}`);

    // Call UddoktaPay API
    const response = await fetch(checkoutUrl, {
      method: 'POST',
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    let data: any = {};
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('[UDDOKTAPAY_PARSE_ERROR] Non-JSON response from UddoktaPay:', responseText);
      return res.status(502).json({
        success: false,
        error: 'Invalid response from UddoktaPay payment gateway. Please try again or choose Cash on Delivery.',
        details: responseText.slice(0, 300)
      });
    }

    if (!response.ok || data.status === false || !data.payment_url) {
      console.error('[UDDOKTAPAY_INIT_FAILED] Status:', response.status, data);
      return res.status(400).json({
        success: false,
        error: data.message || 'Failed to initiate payment with UddoktaPay.',
        details: data
      });
    }

    // Set order status to Pending online payment in database
    await updateOrderInDatabase(safeOrderId, {
      payment_status: 'Pending',
      payment_method: 'Online Payment (UddoktaPay)',
      timeline_note: 'Initiated online payment session via UddoktaPay'
    });

    return res.status(200).json({
      success: true,
      payment_url: data.payment_url,
      order_id: safeOrderId,
      order_number: safeOrderNo
    });
  } catch (error: any) {
    console.error('[UDDOKTAPAY_INIT_EXCEPTION]', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while connecting to UddoktaPay.'
    });
  }
}

/**
 * 2. GET & POST /api/payment/uddoktapay/success
 * Success callback when customer completes payment on UddoktaPay
 */
export async function successCallback(req: Request, res: Response) {
  try {
    const invoice_id = (req.query.invoice_id || req.body?.invoice_id || '').toString().trim();
    const appBaseUrl = getAppBaseUrl(req);

    if (!invoice_id) {
      console.warn('[UDDOKTAPAY_SUCCESS] Missing invoice_id parameter in callback.');
      return res.redirect(`${appBaseUrl}/?payment_status=error&message=missing_invoice_id`);
    }

    const { apiKey, verifyUrl } = getUddoktaPayConfig();
    console.log(`[UDDOKTAPAY_VERIFY] Verifying invoice ${invoice_id} at ${verifyUrl}...`);

    // Verify payment server-to-server with UddoktaPay
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ invoice_id })
    });

    const verifyText = await verifyRes.text();
    let verifyData: UddoktaPayVerifyResponse | null = null;
    try {
      verifyData = JSON.parse(verifyText);
    } catch (e) {
      console.error('[UDDOKTAPAY_VERIFY_PARSE_ERROR]', verifyText);
    }

    if (!verifyData) {
      return res.redirect(`${appBaseUrl}/?payment_status=failed&invoice_id=${encodeURIComponent(invoice_id)}`);
    }

    const isCompleted = verifyData.status === 'COMPLETED';
    const metadata = verifyData.metadata || {};
    const orderIdentifier = metadata.order_id || metadata.order_number || invoice_id;
    const trxId = verifyData.transaction_id || invoice_id;
    const paymentMethodLabel = `Online Payment (${(verifyData.payment_method || 'bKash/Nagad').toUpperCase()} - UddoktaPay)`;

    console.log(`[UDDOKTAPAY_VERIFIED] Invoice: ${invoice_id}, Status: ${verifyData.status}, TrxID: ${trxId}, Order: ${orderIdentifier}`);

    if (isCompleted) {
      // Execute database update: payment_status = 'Paid', transaction_id, status = 'Confirmed'
      const updatedOrder = await updateOrderInDatabase(orderIdentifier, {
        payment_status: 'Paid',
        transaction_id: trxId,
        payment_method: paymentMethodLabel,
        status: 'Confirmed',
        timeline_note: `Payment confirmed ৳${verifyData.amount} via ${verifyData.payment_method || 'UddoktaPay'}. TrxID: ${trxId}`,
        payment_details: verifyData
      });

      const orderNo = updatedOrder?.order_number || metadata.order_number || orderIdentifier;
      const orderId = updatedOrder?.id || metadata.order_id || '';

      // Redirect customer to store with order confirmation and success indicators
      return res.redirect(
        `${appBaseUrl}/?order_success=${encodeURIComponent(orderNo)}&payment_status=paid&trx_id=${encodeURIComponent(trxId)}&order_id=${encodeURIComponent(orderId)}`
      );
    } else {
      // Payment was not completed (e.g. pending or error)
      await updateOrderInDatabase(orderIdentifier, {
        payment_status: 'Failed',
        payment_details: verifyData,
        timeline_note: `Payment status received from gateway: ${verifyData.status}`
      });

      return res.redirect(
        `${appBaseUrl}/?order_number=${encodeURIComponent(metadata.order_number || '')}&payment_status=failed&reason=${encodeURIComponent(verifyData.status)}`
      );
    }
  } catch (error: any) {
    console.error('[UDDOKTAPAY_SUCCESS_EXCEPTION]', error);
    const appBaseUrl = getAppBaseUrl(req);
    return res.redirect(`${appBaseUrl}/?payment_status=error&message=internal_server_error`);
  }
}

/**
 * 3. GET /api/payment/uddoktapay/cancel
 * Cancel callback when customer aborts payment on gateway
 */
export async function cancelCallback(req: Request, res: Response) {
  try {
    const order_id = (req.query.order_id || '').toString();
    const order_number = (req.query.order_number || '').toString();
    const appBaseUrl = getAppBaseUrl(req);
    const orderIdentifier = order_id || order_number;

    console.log(`[UDDOKTAPAY_CANCELLED] Customer cancelled payment for order: ${orderIdentifier}`);

    if (orderIdentifier) {
      await updateOrderInDatabase(orderIdentifier, {
        payment_status: 'Failed',
        timeline_note: 'Online payment cancelled by customer at payment gateway'
      });
    }

    return res.redirect(
      `${appBaseUrl}/?order_number=${encodeURIComponent(order_number)}&payment_status=cancelled`
    );
  } catch (error: any) {
    console.error('[UDDOKTAPAY_CANCEL_EXCEPTION]', error);
    const appBaseUrl = getAppBaseUrl(req);
    return res.redirect(`${appBaseUrl}/?payment_status=cancelled`);
  }
}

/**
 * 4. POST /api/payment/uddoktapay/webhook
 * Asynchronous Instant Payment Notification (IPN) webhook from UddoktaPay
 */
export async function webhookCallback(req: Request, res: Response) {
  try {
    const { apiKey, verifyUrl } = getUddoktaPayConfig();
    const reqApiKey = (req.headers['rt-uddoktapay-api-key'] || req.headers['x-api-key'] || '').toString().trim();

    // Verify API Key security header if provided
    if (reqApiKey && reqApiKey !== apiKey) {
      console.warn('[UDDOKTAPAY_WEBHOOK] Unauthorized webhook request with invalid key.');
      return res.status(401).json({ success: false, error: 'Unauthorized IPN request' });
    }

    const payload = req.body || {};
    const invoice_id = payload.invoice_id;

    if (!invoice_id) {
      return res.status(400).json({ success: false, error: 'Missing invoice_id in webhook payload' });
    }

    console.log(`[UDDOKTAPAY_WEBHOOK_RECEIVED] Received IPN for invoice: ${invoice_id}`);

    // Verify invoice with UddoktaPay server
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ invoice_id })
    });

    const verifyData: UddoktaPayVerifyResponse = await verifyRes.json();

    if (verifyData && verifyData.status === 'COMPLETED') {
      const metadata = verifyData.metadata || payload.metadata || {};
      const orderIdentifier = metadata.order_id || metadata.order_number || invoice_id;
      const trxId = verifyData.transaction_id || invoice_id;
      const paymentMethodLabel = `Online Payment (${(verifyData.payment_method || 'bKash/Nagad').toUpperCase()} - UddoktaPay)`;

      await updateOrderInDatabase(orderIdentifier, {
        payment_status: 'Paid',
        transaction_id: trxId,
        payment_method: paymentMethodLabel,
        status: 'Confirmed',
        timeline_note: `IPN Webhook verified payment ৳${verifyData.amount} via ${verifyData.payment_method || 'UddoktaPay'}. TrxID: ${trxId}`,
        payment_details: verifyData
      });

      console.log(`[UDDOKTAPAY_WEBHOOK_SUCCESS] Order ${orderIdentifier} confirmed paid via IPN`);
      return res.status(200).json({ success: true, message: 'Order payment status updated to Paid' });
    } else {
      console.log(`[UDDOKTAPAY_WEBHOOK_STATUS] Non-completed status: ${verifyData?.status}`);
      return res.status(200).json({ success: true, message: `Payment status is ${verifyData?.status}` });
    }
  } catch (error: any) {
    console.error('[UDDOKTAPAY_WEBHOOK_ERROR]', error);
    return res.status(500).json({ success: false, error: error.message || 'Webhook processing failed' });
  }
}

/**
 * 5. GET /api/payment/uddoktapay/verify/:invoice_id
 * Public or admin verification endpoint to query status of a payment invoice
 */
export async function verifyPayment(req: Request, res: Response) {
  try {
    const invoice_id = req.params.invoice_id;
    if (!invoice_id) {
      return res.status(400).json({ success: false, error: 'Invoice ID is required' });
    }

    const { apiKey, verifyUrl } = getUddoktaPayConfig();
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ invoice_id })
    });

    const data = await verifyRes.json();
    return res.status(200).json({
      success: true,
      data
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify invoice with UddoktaPay'
    });
  }
}

/**
 * 6. GET /api/payment/config
 * Public endpoint to check available payment methods
 */
export async function getPaymentConfig(req: Request, res: Response) {
  const isUddoktaPayConfigured = Boolean(process.env.UDDOKTAPAY_API_KEY || true);
  return res.status(200).json({
    success: true,
    methods: [
      {
        id: 'cod',
        name: 'Cash on Delivery',
        name_bn: 'ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য পরিশোধ)',
        enabled: true,
        recommended: true
      },
      {
        id: 'uddoktapay',
        name: 'Online Payment (bKash, Nagad, Rocket)',
        name_bn: 'অনলাইন পেমেন্ট (বিকাশ, নগদ, রকেট, কার্ড)',
        gateway: 'UddoktaPay',
        enabled: isUddoktaPayConfigured,
        supported_methods: ['bKash', 'Nagad', 'Rocket', 'Upay', 'Visa/Mastercard']
      }
    ]
  });
}
