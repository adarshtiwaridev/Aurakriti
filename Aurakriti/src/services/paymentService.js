function loadScript(src) {
  return new Promise((resolve) => {
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
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

async function parseResponse(response) {
  const payload = await response.json();

  if (!response.ok || !payload.success) {
    throw new Error(payload.message || 'Payment request failed');
  }

  return payload.data;
}

async function markPaymentFailure(orderId, razorpayOrderId, reason) {
  try {
    await fetch('/api/payment/failure', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
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
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ shippingAddress, ...(method ? { method } : {}) }),
  });

  return parseResponse(response);
}

export async function finalizeOrder(orderId, payment) {
  const endpoint = payment?.method === 'cod' ? '/api/order/confirm' : '/api/payment/verify';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payment?.method === 'cod' ? { orderId } : { orderId, ...payment }),
  });

  return parseResponse(response);
}

export async function processPayment({ checkoutData, customer }) {
  const razorpayOrder = checkoutData.razorpay;

  if (!razorpayOrder?.id || !razorpayOrder?.key) {
    throw new Error('Invalid Razorpay order payload received from server.');
  }

  const loaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
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
          const order = await finalizeOrder(checkoutData.orderId, paymentResponse);
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
          await markPaymentFailure(checkoutData.orderId, razorpayOrder.id, 'Payment was cancelled by user');
          reject(new Error('Payment was cancelled.'));
        },
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', async (response) => {
      const description = response?.error?.description || 'Payment failed at Razorpay.';
      await markPaymentFailure(checkoutData.orderId, razorpayOrder.id, description);
      reject(new Error(description));
    });

    rzp.open();
  });
}
