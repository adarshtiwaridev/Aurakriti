import path from 'path';
import { promises as fs } from 'fs';
import PDFDocument from 'pdfkit';

const INVOICE_DIR = path.join(process.cwd(), 'public', 'invoices');

function orderCode(orderId) {
  return String(orderId).slice(-8).toUpperCase();
}

function formatCurrency(amount) {
  return `Rs ${Number(amount || 0).toFixed(2)}`;
}

function invoicePublicUrl(fileName) {
  return `/invoices/${fileName}`;
}

export async function generateInvoicePdfBuffer(order, user) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const code = orderCode(order._id);
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const shippingAddress = order.shippingAddress || {};
    const paymentId = order.paymentDetails?.razorpayPaymentId || 'N/A';
    const provider = order.paymentProvider === 'cod' ? 'Cash on Delivery' : 'Razorpay';

    doc.fontSize(20).text('EcoCommerce Invoice', { align: 'left' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#4b5563').text(`Invoice Date: ${createdAt.toLocaleDateString('en-IN')}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Order Code: #${code}`);
    doc.text(`Payment Method: ${provider}`);
    doc.text(`Payment ID: ${paymentId}`);

    doc.moveDown(1);
    doc.fillColor('#111827').fontSize(12).text('Bill To');
    doc.fontSize(10).fillColor('#374151');
    doc.text(shippingAddress.name || user?.name || 'Customer');
    doc.text(shippingAddress.email || user?.email || 'N/A');
    doc.text(shippingAddress.contact || 'N/A');
    doc.text([shippingAddress.address, shippingAddress.city, shippingAddress.state, shippingAddress.postalCode].filter(Boolean).join(', ') || 'N/A');

    doc.moveDown(1);
    doc.fillColor('#111827').fontSize(12).text('Items');
    doc.moveDown(0.4);

    (order.items || []).forEach((item, index) => {
      const lineTotal = Number(item.price || 0) * Number(item.quantity || 0);
      doc
        .fontSize(10)
        .fillColor('#111827')
        .text(`${index + 1}. ${item.title}`)
        .fillColor('#4b5563')
        .text(`Qty: ${item.quantity} x ${formatCurrency(item.price)} = ${formatCurrency(lineTotal)}`)
        .moveDown(0.3);
    });

    doc.moveDown(1);
    doc.fillColor('#111827').fontSize(12).text('Pricing');
    doc.fontSize(10).fillColor('#374151');
    doc.text(`Subtotal: ${formatCurrency(order.subtotal)}`);
    doc.text(`Shipping: ${Number(order.shippingFee || 0) === 0 ? 'Free' : formatCurrency(order.shippingFee)}`);
    doc.fontSize(11).fillColor('#065f46').text(`Total: ${formatCurrency(order.totalAmount)}`);

    doc.moveDown(1.2);
    doc.fontSize(9).fillColor('#6b7280').text('This is a system generated invoice and does not require a signature.');

    doc.end();
  });
}

export async function saveInvoicePdf(order, pdfBuffer) {
  await fs.mkdir(INVOICE_DIR, { recursive: true });

  const fileName = `invoice-${String(order._id)}.pdf`;
  const absolutePath = path.join(INVOICE_DIR, fileName);
  await fs.writeFile(absolutePath, pdfBuffer);

  return {
    fileName,
    absolutePath,
    publicUrl: invoicePublicUrl(fileName),
  };
}

export async function generateAndStoreInvoice(order, user) {
  const pdfBuffer = await generateInvoicePdfBuffer(order, user);
  const invoice = await saveInvoicePdf(order, pdfBuffer);
  return { ...invoice, pdfBuffer };
}