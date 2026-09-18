import type { IncomingMessage, ServerResponse } from 'http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, setLogLevel } from 'firebase/firestore';

try {
  setLogLevel('error');
} catch (e) {}

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket: 'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

function getFirestoreDb() {
  const app = getApps().length > 0 ? getApp() : initializeApp(DEFAULT_FIREBASE_CONFIG);
  const dbId = DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;
  return dbId && dbId !== '(default)' ? getFirestore(app, dbId) : getFirestore(app);
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

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-password');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let bodyText = '';
    req.on('data', (chunk) => {
      bodyText += chunk;
    });

    req.on('end', async () => {
      try {
        const body = JSON.parse(bodyText || '{}');
        const rawOrder = body.order || body;

        const customerName = String(rawOrder.customer_name || 'Customer').trim();
        const phone = String(rawOrder.phone || rawOrder.customer_phone || '').trim();
        const address = String(rawOrder.address || '').trim();

        if (!phone) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, error: 'Phone number is required' }));
          return;
        }

        const db = getFirestoreDb();
        const orderId = String(rawOrder.id || `ord-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`);
        const orderNumber = String(rawOrder.order_number || `MX-${Date.now().toString().slice(-6)}`);
        const total = Number(rawOrder.total !== undefined ? rawOrder.total : rawOrder.total_amount || 0);

        const orderRecord = cleanForFirestore({
          ...rawOrder,
          id: orderId,
          order_number: orderNumber,
          customer_name: customerName,
          phone,
          customer_phone: phone,
          address,
          total,
          total_amount: total,
          status: rawOrder.status || rawOrder.order_status || 'Pending',
          payment_method: rawOrder.payment_method || 'Cash on Delivery',
          created_at: rawOrder.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: Array.isArray(rawOrder.items) ? rawOrder.items : [],
        });

        const customerId = String(rawOrder.customer_id || `cust-${phone.replace(/[^0-9]/g, '') || Date.now().toString(36)}`);
        const customerRecord = cleanForFirestore({
          id: customerId,
          name: customerName,
          phone,
          alt_phone: String(rawOrder.alt_phone || ''),
          email: String(rawOrder.email || ''),
          district: String(rawOrder.district || ''),
          area: String(rawOrder.area || ''),
          address,
          total_orders: 1,
          total_spent: total,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        // 1. Save order to Firestore
        await setDoc(doc(db, 'orders', orderId), orderRecord, { merge: true });
        // 2. Save customer to Firestore
        await setDoc(doc(db, 'customers', customerId), customerRecord, { merge: true });

        // 3. Update stock for ordered products in Firestore
        if (Array.isArray(orderRecord.items)) {
          for (const item of orderRecord.items) {
            const pId = String(item.product_id || '');
            const qty = Number(item.quantity || 1);
            if (pId && qty > 0) {
              try {
                const prodRef = doc(db, 'products', pId);
                const prodSnap = await getDoc(prodRef);
                if (prodSnap.exists()) {
                  const currentStock = Number(prodSnap.data()?.stock || 0);
                  const newStock = Math.max(0, currentStock - qty);
                  await setDoc(prodRef, { stock: newStock, updated_at: new Date().toISOString() }, { merge: true });
                }
              } catch (e) {
                console.warn('Stock update note:', e);
              }
            }
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 201;
        res.end(JSON.stringify({ success: true, message: 'Order placed successfully', order: orderRecord }));
      } catch (err: any) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err?.message || 'Server order error' }));
      }
    });
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 405;
  res.end(JSON.stringify({ error: 'Method not allowed' }));
}
