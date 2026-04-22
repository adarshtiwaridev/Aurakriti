import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Order from '@/models/Order';

export async function GET(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
  const status = searchParams.get('status');
  const paymentStatus = searchParams.get('paymentStatus');
  const search = searchParams.get('search');

  const query = {};
  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;

  const total = await Order.countDocuments(query);

  let ordersQuery = Order.find(query)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const orders = await ordersQuery.lean();

  // Filter by user name/email after populate if search provided
  const filtered = search?.trim()
    ? orders.filter((o) => {
        const s = search.trim().toLowerCase();
        return (
          o.user?.name?.toLowerCase().includes(s) ||
          o.user?.email?.toLowerCase().includes(s) ||
          String(o._id).includes(s)
        );
      })
    : orders;

  return NextResponse.json({
    success: true,
    data: {
      orders: filtered,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

export async function PATCH(request) {
  const auth = await requireRole(request, ['admin']);
  if (auth.error) return auth.error;

  await connectDB();

  const body = await request.json();
  const { orderId, status } = body;

  if (!orderId) {
    return NextResponse.json({ success: false, message: 'orderId is required.' }, { status: 400 });
  }

  const validStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
  if (status && !validStatuses.includes(status)) {
    return NextResponse.json({ success: false, message: 'Invalid status.' }, { status: 400 });
  }

  const update = {};
  if (status) {
    update.status = status;
    const now = new Date();
    if (status === 'confirmed') update['statusTimeline.confirmedAt'] = now;
    if (status === 'shipped') update['statusTimeline.shippedAt'] = now;
    if (status === 'delivered') update['statusTimeline.deliveredAt'] = now;
    if (status === 'cancelled') update['statusTimeline.cancelledAt'] = now;
  }

  const order = await Order.findByIdAndUpdate(orderId, update, { new: true })
    .populate('user', 'name email');

  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: { order } });
}
