import Notification from '@/models/Notification';

function shortOrderCode(orderId) {
  return String(orderId || '').slice(-8).toUpperCase();
}

export async function notifySellersForNewOrder(order, user) {
  const items = Array.isArray(order.items) ? order.items : [];
  if (!items.length) return;

  const sellerMap = new Map();
  for (const item of items) {
    const sellerId = String(item.seller);
    if (!sellerMap.has(sellerId)) {
      sellerMap.set(sellerId, []);
    }
    sellerMap.get(sellerId).push(item);
  }

  const docs = [];
  for (const [sellerId, sellerItems] of sellerMap.entries()) {
    const itemNames = sellerItems.map((it) => it.title).slice(0, 3).join(', ');
    docs.push({
      sellerId,
      type: 'order',
      title: 'New Order Received',
      message: `New order #${shortOrderCode(order._id)} by ${user?.name || 'a customer'} for ${itemNames}${sellerItems.length > 3 ? '...' : ''}`,
      orderId: order._id,
      productId: sellerItems[0]?.product ?? null,
      metadata: {
        orderId: String(order._id),
        productName: sellerItems[0]?.title || '',
        userName: user?.name || '',
        userEmail: user?.email || '',
        itemCount: sellerItems.length,
        time: new Date().toISOString(),
      },
    });
  }

  if (docs.length) {
    await Notification.insertMany(docs, { ordered: false });
  }
}

export async function notifyUserOrderStatus(order, status) {
  if (!order?.user?._id && !order?.user) return;
  const userId = String(order.user?._id || order.user);
  const label = String(status || '').charAt(0).toUpperCase() + String(status || '').slice(1);

  await Notification.create({
    userId,
    type: 'update',
    title: `Order ${label}`,
    message: `Your order #${shortOrderCode(order._id)} is now ${label}.`,
    orderId: order._id,
    productId: order.items?.[0]?.product ?? null,
    metadata: {
      orderId: String(order._id),
      status,
      time: new Date().toISOString(),
    },
  });
}

export async function notifyUsersForNewProduct(product, users = []) {
  if (!users.length) return;

  const docs = users.map((u) => ({
    userId: String(u._id),
    type: 'offer',
    title: 'New Product Added',
    message: `New product launch: ${product.title}`,
    productId: product._id,
    metadata: {
      productId: String(product._id),
      productName: product.title,
      price: product.price,
      category: product.category,
      time: new Date().toISOString(),
    },
  }));

  await Notification.insertMany(docs, { ordered: false });
}

export function mapNotification(n) {
  return {
    id: String(n._id),
    userId: n.userId ? String(n.userId) : null,
    sellerId: n.sellerId ? String(n.sellerId) : null,
    type: n.type,
    title: n.title,
    message: n.message,
    orderId: n.orderId ? String(n.orderId) : null,
    productId: n.productId ? String(n.productId) : null,
    metadata: n.metadata || {},
    isRead: !!n.isRead,
    readAt: n.readAt || null,
    createdAt: n.createdAt,
  };
}
