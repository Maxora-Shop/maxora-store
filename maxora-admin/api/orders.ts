import type { IncomingMessage, ServerResponse } from 'http';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  runTransaction,
  setLogLevel,
} from 'firebase/firestore';

try {
  setLogLevel('error');
} catch (e) {
  // Ignore Firebase logging configuration errors
}

const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'gen-lang-client-0786093112',
  appId: '1:69433257808:web:fb4fbbe84e9a5188354655',
  apiKey: 'AIzaSyCTbIx95MxDltN100CSrPA9e9J-YrdF3Gg',
  authDomain: 'gen-lang-client-0786093112.firebaseapp.com',
  firestoreDatabaseId:
    'ai-studio-maxorapremiumonl-a712e7fa-09e4-41f4-9cfb-9515c7736ab5',
  storageBucket:
    'gen-lang-client-0786093112.firebasestorage.app',
  messagingSenderId: '69433257808',
};

function getFirestoreDb() {
  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp(DEFAULT_FIREBASE_CONFIG);

  const dbId = DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;

  return dbId && dbId !== '(default)'
    ? getFirestore(app, dbId)
    : getFirestore(app);
}

/**
 * Remove undefined values and make data Firestore-safe.
 */
function cleanForFirestore(data: any): any {
  if (data === null || data === undefined) {
    return '';
  }

  if (Array.isArray(data)) {
    return data.map(cleanForFirestore);
  }

  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }

    return cleaned;
  }

  return data;
}

/**
 * Send JSON response.
 */
function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: Record<string, any>
) {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload));
}

/**
 * Read request body safely.
 */
function readRequestBody(
  req: IncomingMessage
): Promise<string> {
  return new Promise((resolve, reject) => {
    let bodyText = '';

    req.on('data', (chunk) => {
      bodyText += chunk;
    });

    req.on('end', () => {
      resolve(bodyText);
    });

    req.on('error', (error) => {
      reject(error);
    });
  });
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  // ---------------------------------------------------------
  // CORS
  // ---------------------------------------------------------

  res.setHeader(
    'Access-Control-Allow-Origin',
    '*'
  );

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, OPTIONS'
  );

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-admin-password'
  );

  // ---------------------------------------------------------
  // OPTIONS
  // ---------------------------------------------------------

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  // ---------------------------------------------------------
  // Only POST is supported
  // ---------------------------------------------------------

  if (req.method !== 'POST') {
    sendJson(res, 405, {
      success: false,
      error: 'Method not allowed',
    });

    return;
  }

  try {
    // -------------------------------------------------------
    // 1. Read request body
    // -------------------------------------------------------

    const bodyText = await readRequestBody(req);

    let body: any;

    try {
      body = JSON.parse(bodyText || '{}');
    } catch (error) {
      sendJson(res, 400, {
        success: false,
        error: 'Invalid JSON request body',
      });

      return;
    }

    // -------------------------------------------------------
    // 2. Get order payload
    // -------------------------------------------------------

    const rawOrder = body?.order || body;

    if (
      !rawOrder ||
      typeof rawOrder !== 'object' ||
      Array.isArray(rawOrder)
    ) {
      sendJson(res, 400, {
        success: false,
        error: 'Invalid order data',
      });

      return;
    }

    // -------------------------------------------------------
    // 3. Basic customer/order information
    // -------------------------------------------------------

    const customerName = String(
      rawOrder.customer_name || 'Customer'
    ).trim();

    const phone = String(
      rawOrder.phone ||
        rawOrder.customer_phone ||
        ''
    ).trim();

    const address = String(
      rawOrder.address || ''
    ).trim();

    if (!phone) {
      sendJson(res, 400, {
        success: false,
        error: 'Phone number is required',
      });

      return;
    }

    // -------------------------------------------------------
    // 4. Firebase
    // -------------------------------------------------------

    const db = getFirestoreDb();

    const nowIso = new Date().toISOString();

    // -------------------------------------------------------
    // 5. Stable Order ID
    // -------------------------------------------------------

    const orderId = String(
      rawOrder.id ||
        `ord-${Date.now().toString(36)}-${Math.floor(
          Math.random() * 1000
        )}`
    ).trim();

    if (!orderId) {
      sendJson(res, 400, {
        success: false,
        error: 'Invalid order ID',
      });

      return;
    }

    // -------------------------------------------------------
    // 6. Order number
    // -------------------------------------------------------

    const orderNumber = String(
      rawOrder.order_number ||
        `MX-${Date.now().toString().slice(-6)}`
    ).trim();

    // -------------------------------------------------------
    // 7. Total
    // -------------------------------------------------------

    const total = Number(
      rawOrder.total !== undefined
        ? rawOrder.total
        : rawOrder.total_amount || 0
    );

    if (!Number.isFinite(total) || total < 0) {
      sendJson(res, 400, {
        success: false,
        error: 'Invalid order total',
      });

      return;
    }

    // -------------------------------------------------------
    // 8. Items
    // -------------------------------------------------------

    const items = Array.isArray(rawOrder.items)
      ? rawOrder.items
      : [];

    // -------------------------------------------------------
    // 9. Customer ID
    // -------------------------------------------------------

    const customerId = String(
      rawOrder.customer_id ||
        `cust-${
          phone.replace(/[^0-9]/g, '') ||
          Date.now().toString(36)
        }`
    ).trim();

    if (!customerId) {
      sendJson(res, 400, {
        success: false,
        error: 'Invalid customer ID',
      });

      return;
    }

    // -------------------------------------------------------
    // 10. Firestore references
    // -------------------------------------------------------

    const orderRef = doc(
      db,
      'orders',
      orderId
    );

    const customerRef = doc(
      db,
      'customers',
      customerId
    );

    // -------------------------------------------------------
    // 11. Prepare Order record
    // -------------------------------------------------------

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

      status:
        rawOrder.status ||
        rawOrder.order_status ||
        'Pending',

      payment_method:
        rawOrder.payment_method ||
        'Cash on Delivery',

      created_at:
        rawOrder.created_at ||
        nowIso,

      updated_at: nowIso,

      items,
    });

    // -------------------------------------------------------
    // 12. Aggregate product quantities
    //
    // If the same product appears twice in cart/order,
    // stock will be reduced only once using the total quantity.
    // -------------------------------------------------------

    const productQuantities = new Map<
      string,
      number
    >();

    for (const item of items) {
      const productId = String(
        item?.product_id || ''
      ).trim();

      const quantity = Number(
        item?.quantity || 1
      );

      if (
        !productId ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        continue;
      }

      const previousQuantity =
        productQuantities.get(productId) || 0;

      productQuantities.set(
        productId,
        previousQuantity + quantity
      );
    }

    // -------------------------------------------------------
    // 13. Product references
    // -------------------------------------------------------

    const productRefs = Array.from(
      productQuantities.keys()
    ).map((productId) =>
      doc(db, 'products', productId)
    );

    // -------------------------------------------------------
    // 14. ATOMIC FIRESTORE TRANSACTION
    //
    // Everything below happens as one transaction:
    //
    //   - Check duplicate order
    //   - Read customer
    //   - Read product stock
    //   - Create order
    //   - Update customer
    //   - Update product stock
    //
    // If something fails, Firestore rolls back the transaction.
    // -------------------------------------------------------

    const transactionResult =
      await runTransaction(
        db,
        async (transaction) => {
          // -------------------------------------------------
          // IMPORTANT:
          // All reads happen before writes.
          // -------------------------------------------------

          const orderSnap =
            await transaction.get(orderRef);

          // -------------------------------------------------
          // Duplicate protection
          // -------------------------------------------------

          if (orderSnap.exists()) {
            return {
              duplicate: true,
              existingOrder:
                orderSnap.data(),
            };
          }

          // -------------------------------------------------
          // Read existing customer
          // -------------------------------------------------

          const customerSnap =
            await transaction.get(customerRef);

          const existingCustomer =
            customerSnap.exists()
              ? customerSnap.data()
              : {};

          const previousTotalOrders =
            Number(
              existingCustomer.total_orders || 0
            );

          const previousTotalSpent =
            Number(
              existingCustomer.total_spent || 0
            );

          // -------------------------------------------------
          // Read all products
          // -------------------------------------------------

          const productSnapshots =
            new Map<
              string,
              any
            >();

          for (
            let index = 0;
            index < productRefs.length;
            index++
          ) {
            const productId =
              Array.from(
                productQuantities.keys()
              )[index];

            const productRef =
              productRefs[index];

            const productSnap =
              await transaction.get(
                productRef
              );

            productSnapshots.set(
              productId,
              productSnap
            );
          }

          // -------------------------------------------------
          // Validate products before writing anything
          // -------------------------------------------------

          for (
            const [
              productId,
              quantity,
            ] of productQuantities
          ) {
            const productSnap =
              productSnapshots.get(
                productId
              );

            if (!productSnap?.exists()) {
              throw new Error(
                `Product not found: ${productId}`
              );
            }

            const productData =
              productSnap.data();

            const currentStock =
              Number(
                productData?.stock || 0
              );

            if (
              !Number.isFinite(
                currentStock
              )
            ) {
              throw new Error(
                `Invalid stock for product: ${productId}`
              );
            }

            // Keep existing behavior:
            // stock cannot become negative.
            // The order can still be created if
            // requested quantity is greater than stock.
            const newStock =
              Math.max(
                0,
                currentStock - quantity
              );

            if (newStock < 0) {
              throw new Error(
                `Invalid stock calculation for product: ${productId}`
              );
            }
          }

          // -------------------------------------------------
          // Customer record
          // -------------------------------------------------

          const customerRecord =
            cleanForFirestore({
              id: customerId,

              name: customerName,

              phone,

              alt_phone: String(
                rawOrder.alt_phone ||
                  existingCustomer.alt_phone ||
                  ''
              ),

              email: String(
                rawOrder.email ||
                  existingCustomer.email ||
                  ''
              ),

              district: String(
                rawOrder.district ||
                  existingCustomer.district ||
                  ''
              ),

              area: String(
                rawOrder.area ||
                  existingCustomer.area ||
                  ''
              ),

              address:
                address ||
                String(
                  existingCustomer.address ||
                    ''
                ),

              // Preserve previous totals
              total_orders:
                previousTotalOrders + 1,

              total_spent:
                previousTotalSpent + total,

              // Preserve original creation date
              created_at:
                existingCustomer.created_at ||
                nowIso,

              updated_at: nowIso,
            });

          // -------------------------------------------------
          // WRITE 1: Order
          // -------------------------------------------------

          transaction.set(
            orderRef,
            orderRecord,
            {
              merge: true,
            }
          );

          // -------------------------------------------------
          // WRITE 2: Customer
          // -------------------------------------------------

          transaction.set(
            customerRef,
            customerRecord,
            {
              merge: true,
            }
          );

          // -------------------------------------------------
          // WRITE 3: Product stock
          // -------------------------------------------------

          for (
            const [
              productId,
              quantity,
            ] of productQuantities
          ) {
            const productRef =
              doc(
                db,
                'products',
                productId
              );

            const productSnap =
              productSnapshots.get(
                productId
              );

            const currentStock =
              Number(
                productSnap.data()?.stock ||
                  0
              );

            const newStock =
              Math.max(
                0,
                currentStock - quantity
              );

            transaction.set(
              productRef,
              {
                stock: newStock,
                updated_at: nowIso,
              },
              {
                merge: true,
              }
            );
          }

          // -------------------------------------------------
          // Transaction result
          // -------------------------------------------------

          return {
            duplicate: false,
            order: orderRecord,
          };
        }
      );

    // -------------------------------------------------------
    // 15. Duplicate order response
    // -------------------------------------------------------

    if (transactionResult.duplicate) {
      sendJson(res, 200, {
        success: true,
        message: 'Order already exists',
        order:
          transactionResult.existingOrder,
        duplicate: true,
      });

      return;
    }

    // -------------------------------------------------------
    // 16. Successful order
    // -------------------------------------------------------

    sendJson(res, 201, {
      success: true,
      message: 'Order placed successfully',
      order: transactionResult.order,
      duplicate: false,
    });
  } catch (err: any) {
    // -------------------------------------------------------
    // 17. Error
    // -------------------------------------------------------

    console.error(
      'Order API error:',
      err
    );

    sendJson(res, 500, {
      success: false,
      error:
        err?.message ||
        'Server order error',
    });
  }
}