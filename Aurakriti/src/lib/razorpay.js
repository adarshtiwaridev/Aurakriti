import crypto from 'crypto';

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

const getRazorpayConfig = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return { keyId, keySecret };
};

export const isRazorpayConfigured = () => Boolean(getRazorpayConfig());

function allowMockPayments() {
  return process.env.NODE_ENV !== 'production' && process.env.DISABLE_MOCK_PAYMENTS !== 'true';
}

function getModeFromKey(keyId) {
  return keyId?.startsWith('rzp_live_') ? 'live' : 'test';
}

export async function createPaymentOrder({ amount, receipt, notes }) {
  const razorpay = getRazorpayConfig();
  const normalizedAmount = Math.round(Number(amount) * 100);

  if (!razorpay) {
    if (allowMockPayments()) {
      return {
        id: `mock_order_${Date.now()}`,
        amount: normalizedAmount,
        currency: 'INR',
        receipt,
        notes,
        mode: 'mock',
        key: 'mock_key',
        mock: true,
      };
    }

    throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
  }

  const authHeader = Buffer.from(`${razorpay.keyId}:${razorpay.keySecret}`).toString('base64');
  const response = await fetch(RAZORPAY_ORDERS_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: normalizedAmount,
      currency: 'INR',
      receipt,
      notes,
    }),
  });

  try {
    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to create Razorpay order: ${errorBody}`);
    }

    const data = await response.json();
    return {
      ...data,
      mode: getModeFromKey(razorpay.keyId),
      key: razorpay.keyId,
    };
  } catch (error) {
    if (allowMockPayments()) {
      return {
        id: `mock_order_${Date.now()}`,
        amount: normalizedAmount,
        currency: 'INR',
        receipt,
        notes,
        mode: 'mock',
        key: 'mock_key',
        mock: true,
        fallbackReason: error.message,
      };
    }

    throw error;
  }
}

export function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const razorpay = getRazorpayConfig();

  if (!razorpay) {
    return { valid: false, mode: 'unconfigured' };
  }

  const expected = crypto
    .createHmac('sha256', razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return {
    valid: expected === signature,
    mode: getModeFromKey(razorpay.keyId),
  };
}
