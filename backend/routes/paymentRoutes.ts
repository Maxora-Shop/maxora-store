import { Router } from 'express';
import {
  initiatePayment,
  successCallback,
  cancelCallback,
  webhookCallback,
  verifyPayment,
  getPaymentConfig,
  testPaymentConnection,
  setSharedPaymentDb
} from '../controllers/uddoktaPayController';

const router = Router();

// Mount Payment routes
router.post('/api/payment/uddoktapay/initiate', initiatePayment);
router.get('/api/payment/uddoktapay/success', successCallback);
router.post('/api/payment/uddoktapay/success', successCallback);
router.get('/api/payment/uddoktapay/cancel', cancelCallback);
router.post('/api/payment/uddoktapay/webhook', webhookCallback);
router.get('/api/payment/uddoktapay/verify/:invoice_id', verifyPayment);
router.get('/api/payment/config', getPaymentConfig);
router.post('/api/admin/payment/test-connection', testPaymentConnection);

// Fallback aliases for generic payment URLs
router.get('/api/payment/success', successCallback);
router.post('/api/payment/success', successCallback);
router.get('/api/payment/cancel', cancelCallback);

export function initPaymentDb(db: any, saveDbFn: () => void, syncVersions?: Record<string, number>) {
  setSharedPaymentDb(db, saveDbFn, syncVersions);
}

export default router;
