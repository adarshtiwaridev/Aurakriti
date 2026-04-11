import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { requireAuth, requireRole } from '@/lib/api-auth';
import Order, { ORDER_STATUS_FLOW, ORDER_STATUS_VALUES } from '@/models/Order';
import { sendOrderStatusEmail } from '@/lib/email';
import { mapOrder } from '@/lib/order-utils';
import { notifyUserOrderStatus } from '@/lib/notifications';
import { generateAndStoreInvoice } from '@/lib/invoice';
import mongoose from 'mongoose';

const VALID_STATUSES = ORDER_STATUS_VALUES;

const ALLOWED_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  processing: ['shipped', 'cancelled'],
};

function normalizeStatus(status) {
  return status === 'processing' ? 'confirmed' : status;
}

function isValidTransition(currentStatus, nextStatus) {
  if (currentStatus === nextStatus) {
    return true;
  }
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

function applyTimeline(order, status) {
  const now = new Date();
  const timeline = {
    ...(order.statusTimeline || {}),
  };

  const normalized = normalizeStatus(status);

  if (normalized === 'confirmed' || normalized === 'shipped' || normalized === 'delivered') {
    if (!timeline.confirmedAt) {
      timeline.confirmedAt = now;
    }
  }

  if ((normalized === 'shipped' || normalized === 'delivered') && !timeline.shippedAt) {
    timeline.shippedAt = now;
  }

  if (normalized === 'delivered' && !timeline.deliveredAt) {
    timeline.deliveredAt = now;
  }

  if (normalized === 'cancelled' && !timeline.cancelledAt) {
    timeline.cancelledAt = now;
  }

  order.statusTimeline = timeline;
}

function recomputeOrderStatus(order) {
  if (!order.items?.length) {
    return order.status;
  }

  const allCancelled = order.items.every((entry) => entry.status === 'cancelled');
  if (allCancelled) {
    return 'cancelled';
  }

  const activeItems = order.items.filter((entry) => entry.status !== 'cancelled');
  if (!activeItems.length) {
    return 'cancelled';
  }

  const minIndex = Math.min(
    ...activeItems.map((entry) => {
      const normalized = normalizeStatus(entry.status);
      return ORDER_STATUS_FLOW.indexOf(normalized) === -1 ? 0 : ORDER_STATUS_FLOW.indexOf(normalized);
    })
  );
  return ORDER_STATUS_FLOW[minIndex];
}

function escapeRegex(value = '') {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function resolveOrderId(reference, scopeQuery = {}) {
  if (!reference) {
    return null;
  }

  if (mongoose.Types.ObjectId.isValid(reference)) {
    return reference;
  }

  const paymentMatch = await Order.findOne({
    ...scopeQuery,
    'paymentDetails.razorpayOrderId': reference,
  })
    .select('_id')
    .lean();

  if (paymentMatch?._id) {
    return paymentMatch._id;
  }

  // Support shorthand order code shown in UI (#AB12CD34 = last 8 chars of Mongo _id)
  const shortCode = String(reference).trim();
  if (shortCode.length >= 6 && shortCode.length <= 24) {
    const regex = `${escapeRegex(shortCode)}$`;
    const shortMatch = await Order.aggregate([
      { $match: scopeQuery },
      { $addFields: { orderIdString: { $toString: '$_id' } } },
      { $match: { orderIdString: { $regex: regex, $options: 'i' } } },
      { $project: { _id: 1 } },
      { $limit: 1 },
    ]);

    if (shortMatch?.[0]?._id) {
      return shortMatch[0]._id;
    }
  }

  return null;
}

export async function GET(request, context) {
  const { id } = await context.params;
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  await connectDB();

  const accessQuery = {};
  if (auth.user.role === 'user') {
    accessQuery.user = auth.user._id;
  }
  if (auth.user.role === 'seller') {
    accessQuery['items.seller'] = auth.user._id;
  }

  const resolvedOrderId = await resolveOrderId(id, accessQuery);
  if (!resolvedOrderId) {
    return NextResponse.json({ success: false, message: 'Order not found for this id/reference.' }, { status: 404 });
  }

  const baseQuery = { ...accessQuery, _id: resolvedOrderId };

  const order = await Order.findOne(baseQuery).populate('user', 'name email role').lean();
  if (!order) {
    return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    data: {
      order: mapOrder(order, auth.user),
    },
  });
}

export async function PATCH(request, context) {
  const { id } = await context.params;
  try {
    const auth = await requireRole(request, ['seller', 'admin']);
    if (auth.error) {
      return auth.error;
    }

    await connectDB();

    const resolvedOrderId = await resolveOrderId(id);
    if (!resolvedOrderId) {
      return NextResponse.json({ success: false, message: 'Order not found for this id/reference.' }, { status: 404 });
    }

    const body = await request.json();
    const { status, itemId, trackingDetails = {} } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: 'Invalid order status.' }, { status: 400 });
    }

    const order = await Order.findById(resolvedOrderId);
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (auth.user.role === 'seller') {
      if (!itemId) {
        return NextResponse.json({ success: false, message: 'itemId is required for seller updates.' }, { status: 400 });
      }

      const item = order.items.id(itemId);
      if (!item || item.seller.toString() !== auth.user._id.toString()) {
        return NextResponse.json({ success: false, message: 'You cannot update this order item.' }, { status: 403 });
      }

      if (!isValidTransition(item.status, status)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status transition from ${item.status} to ${status}.`,
          },
          { status: 400 }
        );
      }

      item.status = status;
      order.status = recomputeOrderStatus(order);
    } else {
      if (!isValidTransition(order.status, status)) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid status transition from ${order.status} to ${status}.`,
          },
          { status: 400 }
        );
      }

      order.status = status;
      order.items.forEach((item) => {
        if (item.status !== 'delivered' && item.status !== 'cancelled') {
          item.status = status;
        }
      });
    }

    applyTimeline(order, order.status);

    if (status === 'shipped') {
      const now = new Date();
      const existing = order.trackingDetails || {};
      order.trackingDetails = {
        ...existing,
        carrier: trackingDetails.carrier ?? existing.carrier ?? '',
        trackingNumber: trackingDetails.trackingNumber ?? existing.trackingNumber ?? '',
        trackingUrl: trackingDetails.trackingUrl ?? existing.trackingUrl ?? '',
        notes: trackingDetails.notes ?? existing.notes ?? '',
        estimatedDelivery:
          trackingDetails.estimatedDelivery
            ? new Date(trackingDetails.estimatedDelivery)
            : existing.estimatedDelivery || new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        shippedAt: existing.shippedAt || now,
        lastUpdatedAt: now,
      };
    }

    if (status === 'delivered') {
      order.trackingDetails = {
        ...(order.trackingDetails || {}),
        lastUpdatedAt: new Date(),
      };
    }

    await order.save();

    const populatedOrder = await Order.findById(order._id).populate('user', 'name email');

    // Generate invoice as soon as order reaches confirmed/shipped and payment is successful.
    if (
      ['confirmed', 'shipped'].includes(status) &&
      populatedOrder?.paymentStatus === 'paid' &&
      !populatedOrder?.invoice?.url
    ) {
      try {
        const invoice = await generateAndStoreInvoice(populatedOrder, populatedOrder.user);
        populatedOrder.invoice = {
          url: invoice.publicUrl,
          path: invoice.absolutePath,
          fileName: invoice.fileName,
          generatedAt: new Date(),
        };
        await populatedOrder.save();
      } catch (invoiceError) {
        console.error('[Order] Invoice generation on status update failed:', invoiceError);
      }
    }

    const emailStatuses = ['confirmed', 'shipped', 'delivered', 'cancelled'];
    if (emailStatuses.includes(status) && populatedOrder?.user?.email) {
      sendOrderStatusEmail(populatedOrder, populatedOrder.user, status).catch((e) =>
        console.error('[Order] Status email error:', e.message)
      );
    }
    notifyUserOrderStatus(populatedOrder, status).catch((e) =>
      console.error('[Order] Status notification error:', e.message)
    );

    console.log(`[Order] ${populatedOrder._id} status → ${status} by ${auth.user.role}:${auth.user._id}`);

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully.',
      data: {
        order: mapOrder(populatedOrder, auth.user),
        orderId: String(populatedOrder._id),
        status: populatedOrder.status,
        trackingDetails: populatedOrder.trackingDetails ?? {},
      },
    });
  } catch (error) {
    console.error('PATCH /api/orders/[id] failed:', error);
    return NextResponse.json({ success: false, message: 'Failed to update order status.' }, { status: 500 });
  }
}
