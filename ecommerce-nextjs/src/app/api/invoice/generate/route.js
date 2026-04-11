import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectDB from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import Order from '@/models/Order';
import { generateAndStoreInvoice } from '@/lib/invoice';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireRole(request, ['user', 'seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  try {
    await connectDB();
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'orderId is required.' }, { status: 400 });
    }

    const query = {};
    if (mongoose.Types.ObjectId.isValid(orderId)) {
      query._id = orderId;
    } else {
      query['paymentDetails.razorpayOrderId'] = orderId;
    }

    if (auth.user.role === 'user') {
      query.user = auth.user._id;
    }
    if (auth.user.role === 'seller') {
      query['items.seller'] = auth.user._id;
    }

    const order = await Order.findOne(query).populate('user', 'name email');
    if (!order) {
      return NextResponse.json({ success: false, message: 'Order not found.' }, { status: 404 });
    }

    if (order.paymentStatus !== 'paid') {
      return NextResponse.json(
        { success: false, message: 'Invoice is available only after successful payment.' },
        { status: 400 }
      );
    }

    if (order.invoice?.url && order.invoice?.path) {
      return NextResponse.json({
        success: true,
        data: {
          orderId: String(order._id),
          invoiceUrl: order.invoice.url,
        },
      });
    }

    const invoice = await generateAndStoreInvoice(order, order.user);
    order.invoice = {
      url: invoice.publicUrl,
      path: invoice.absolutePath,
      fileName: invoice.fileName,
      generatedAt: new Date(),
    };
    await order.save();

    console.log('[Invoice/Generate] Generated invoice:', {
      orderId: String(order._id),
      invoiceUrl: invoice.publicUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: String(order._id),
        invoiceUrl: invoice.publicUrl,
      },
    });
  } catch (error) {
    console.error('POST /api/invoice/generate failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Unable to generate invoice.' }, { status: 500 });
  }
}
