import { apiRequest } from '@/services/apiClient';

let razorpayScriptPromise = null;

function getCspNonce() {
  if (typeof document === 'undefined') {
    return '';
  }

  return document.querySelector('meta[name="csp-nonce"]')?.getAttribute('content') || '';
}

function loadScript(src) {
  if (razorpayScriptPromise) {
    return razorpayScriptPromise;
  }

  razorpayScriptPromise = new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    const nonce = getCspNonce();
    if (nonce) {
      script.nonce = nonce;
    }
    script.onload = () => resolve(true);
    script.onerror = () => {
      razorpayScriptPromise = null;
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return razorpayScriptPromise;
}

export async function ensureRazorpayLoaded() {
  const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
  return loaded && typeof window !== 'undefined' && Boolean(window.Razorpay);
}

async function markPaymentFailure(orderId, razorpayOrderId, reason) {
  try {
    await apiRequest('/api/payment/failure', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        razorpay_order_id: razorpayOrderId,
        reason,
      }),
    });
  } catch {
    // Ignore failure reporting errors to avoid masking checkout failures.
  }
}

export async function createCheckout(shippingAddress, method) {
  const endpoint = method === 'cod' ? '/api/checkout' : '/api/payment/create-order';
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify({ shippingAddress, ...(method ? { method } : {}) }),
  });
}

export async function finalizeOrder(orderId, payment) {
  const endpoint = payment?.method === 'cod' ? '/api/order/confirm' : '/api/payment/verify';
  return apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(payment?.method === 'cod' ? { orderId } : { orderId, ...payment }),
  });
}

export async function processPayment({ checkoutData, customer }) {
  const checkoutSessionId = checkoutData.checkoutSessionId || checkoutData.paymentSessionId || checkoutData.orderId;
  const razorpayOrder = checkoutData.razorpay;

  if (!razorpayOrder?.id || !razorpayOrder?.key) {
    throw new Error('Invalid Razorpay order payload received from server.');
  }

  if (razorpayOrder.mode === 'mock' || razorpayOrder.mock) {
    return finalizeOrder(checkoutSessionId, {
      razorpay_order_id: razorpayOrder.id,
      razorpay_payment_id: `mock_payment_${Date.now()}`,
      razorpay_signature: 'mock_signature',
    });
  }

  const loaded = await ensureRazorpayLoaded();
  if (!loaded || !window.Razorpay) {
    throw new Error('Unable to load Razorpay checkout.');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: razorpayOrder.key,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: 'Aurakriti',
      description: 'Jewellery Purchase',
      order_id: razorpayOrder.id,
      handler: async function (paymentResponse) {
        try {
          const order = await finalizeOrder(checkoutSessionId, paymentResponse);
          resolve(order);
        } catch (error) {
          reject(error);
        }
      },
      prefill: {
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
      },
      theme: {
        color: '#16a34a',
      },
      modal: {
        ondismiss: async () => {
          await markPaymentFailure(checkoutSessionId, razorpayOrder.id, 'Payment was cancelled by user');
          reject(new Error('Payment was cancelled.'));
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', async (response) => {
      const description = response?.error?.description || 'Payment failed at Razorpay.';
      await markPaymentFailure(checkoutSessionId, razorpayOrder.id, description);
      reject(new Error(description));
    });

    rzp.open();
  });
}
