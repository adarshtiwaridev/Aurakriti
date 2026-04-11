import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST?.trim() || 'smtp.gmail.com';
const smtpPort = Number(process.env.SMTP_PORT?.trim() || 587);
const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.trim();
const fromEmail = process.env.FROM_EMAIL?.trim() || emailUser;
const fromName = process.env.FROM_NAME?.trim() || 'EcoCommerce';
const EMAIL_MAX_RETRIES = Number(process.env.EMAIL_MAX_RETRIES ?? 3);
const EMAIL_RETRY_DELAY_MS = Number(process.env.EMAIL_RETRY_DELAY_MS ?? 1000);

const isEmailConfigured = !!(emailUser && emailPass && fromEmail);

if (!isEmailConfigured) {
  console.warn('Email disabled: SMTP settings (EMAIL_USER, EMAIL_PASS, FROM_EMAIL) are not configured.');
}

let transporter = null;
if (isEmailConfigured) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  transporter.verify().then(
    () => {
      console.log('SMTP transporter verified successfully.');
    },
    (error) => {
      console.warn('SMTP transporter verification failed:', error.message);
    }
  );
}

const getFromAddress = () => {
  return process.env.FROM_EMAIL
    ? `"${fromName}" <${fromEmail}>`
    : emailUser;
};

export const sendEmail = async (to, subject, html, options = {}) => {
  if (!transporter) {
    console.warn('Email skipped (SMTP not configured):', subject);
    return null;
  }
  const mailOptions = {
    from: getFromAddress(),
    to,
    subject,
    html,
    ...(options.attachments ? { attachments: options.attachments } : {}),
  };

  for (let attempt = 1; attempt <= EMAIL_MAX_RETRIES; attempt += 1) {
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log(`Email sent successfully on attempt ${attempt}:`, result.messageId);
      return result;
    } catch (error) {
      console.error(`Email sending failed (attempt ${attempt}/${EMAIL_MAX_RETRIES}):`, error.message);
      if (attempt >= EMAIL_MAX_RETRIES) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, EMAIL_RETRY_DELAY_MS * attempt));
    }
  }
};

export const sendVerificationEmail = async (email, token) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const verificationUrl = `${appUrl}/auth/verify?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to EcoCommerce!</h2>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;

  return await sendEmail(email, 'Verify Your Email - EcoCommerce', html);
};

export const sendPasswordResetEmail = async (email, token) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your EcoCommerce account.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password</a>
      <p>If the button doesn't work, copy and paste this URL into your browser:</p>
      <p>${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail(email, 'Reset Your Password - EcoCommerce', html);
};

export const sendOTPEmail = async (email, otp, { purpose = 'verification' } = {}) => {
  const isResetOtp = purpose === 'reset-password';
  const heading = isResetOtp ? 'Password Reset OTP' : 'Email Verification OTP';
  const intro = isResetOtp
    ? 'Use this OTP to reset your EcoCommerce password:'
    : 'Use this OTP to verify your EcoCommerce account:';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${heading}</h2>
      <p>${intro}</p>
      <div style="font-size: 24px; font-weight: bold; color: #4CAF50; text-align: center; margin: 20px 0;">
        ${otp}
      </div>
      <p>This OTP will expire in 5 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return await sendEmail(
    email,
    isResetOtp ? 'Password Reset OTP - EcoCommerce' : 'Email Verification OTP - EcoCommerce',
    html
  );
};

export const sendOrderConfirmationEmail = async (order, user) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const invoiceUrl = order.invoice?.url ? `${appUrl}${order.invoice.url}` : '';
  const attachment = order.invoice?.path
    ? [
        {
          filename: order.invoice?.fileName || `invoice-${order._id}.pdf`,
          path: order.invoice.path,
          contentType: 'application/pdf',
        },
      ]
    : [];

  const itemRows = (order.items ?? [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${item.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">&#8377;${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafb;padding:24px;border-radius:16px">
      <div style="background:#16a34a;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px">
        <h1 style="color:#fff;margin:0;font-size:22px">&#10003; Order Confirmed!</h1>
        <p style="color:#dcfce7;margin:8px 0 0">Thank you for shopping with EcoCommerce</p>
      </div>
      <p style="color:#1e293b">Hi <strong>${user.name}</strong>,</p>
      <p style="color:#475569">Your order <strong>#${String(order._id).slice(-8).toUpperCase()}</strong> has been placed successfully.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:12px;overflow:hidden">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b">ITEM</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b">QTY</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b">TOTAL</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
      </table>
      <table style="width:100%;margin-top:8px">
        <tr><td style="color:#64748b">Subtotal</td><td style="text-align:right">&#8377;${order.subtotal?.toFixed(2)}</td></tr>
        <tr><td style="color:#64748b">Shipping</td><td style="text-align:right">${order.shippingFee === 0 ? 'Free' : '&#8377;' + order.shippingFee?.toFixed(2)}</td></tr>
        <tr><td style="font-weight:bold;color:#1e293b;padding-top:8px">Total</td><td style="font-weight:bold;color:#16a34a;text-align:right;padding-top:8px">&#8377;${order.totalAmount?.toFixed(2)}</td></tr>
      </table>
      <p style="color:#94a3b8;font-size:12px;margin-top:24px">Payment: ${order.paymentDetails?.mode === 'cod' ? 'Cash on Delivery' : 'Online Payment'}</p>
      ${invoiceUrl ? `<p style="margin-top:8px"><a href="${invoiceUrl}" style="color:#2563eb;text-decoration:none;font-weight:600">Download Invoice PDF</a></p>` : ''}
      <p style="color:#94a3b8;font-size:12px">EcoCommerce &mdash; Sustainable shopping, delivered.</p>
    </div>`;

  return await sendEmail(
    user.email,
    `Order Confirmed #${String(order._id).slice(-8).toUpperCase()} — EcoCommerce`,
    html,
    attachment.length ? { attachments: attachment } : {}
  );
};

const PRODUCT_LAUNCH_BATCH_SIZE = 25;

export const sendNewProductLaunchEmail = async (product, users = []) => {
  if (!users.length) {
    console.warn('[Email] sendNewProductLaunchEmail: no users provided, skipping.');
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const productUrl = `${appUrl}/products/${product._id ?? product.id}`;
  const imageUrl = product.images?.[0] ?? product.image ?? '';
  const imageHtml = imageUrl
    ? `<img src="${imageUrl}" alt="${product.title}" style="width:100%;max-height:260px;object-fit:cover;border-radius:12px;margin-bottom:20px" />`
    : '';

  const html = `
    <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">
      <div style="background:linear-gradient(135deg,#16a34a 0%,#0d9488 100%);padding:28px 32px;text-align:center">
        <p style="margin:0;color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:0.18em;text-transform:uppercase;font-weight:700">EcoCommerce</p>
        <h1 style="margin:10px 0 0;color:#ffffff;font-size:26px;font-weight:900;letter-spacing:-0.5px">🚀 Just Launched!</h1>
        <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px">A brand-new product is now available.</p>
      </div>

      <div style="padding:28px 32px">
        ${imageHtml}
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:#16a34a">${product.category ?? ''}</p>
        <h2 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.3px">${product.title}</h2>
        <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569">${(product.description ?? '').slice(0, 200)}${(product.description ?? '').length > 200 ? '...' : ''}</p>

        <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding:16px;background:#f8fafc;border-radius:12px">
          <div>
            <p style="margin:0;font-size:12px;color:#94a3b8;font-weight:600">Price</p>
            <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#16a34a">&#8377;${Number(product.price || 0).toLocaleString('en-IN')}</p>
          </div>
          ${product.stock ? `<div style="margin-left:auto;background:#dcfce7;border:1px solid #bbf7d0;padding:6px 14px;border-radius:999px"><p style="margin:0;font-size:13px;font-weight:700;color:#15803d">${product.stock} in stock</p></div>` : ''}
        </div>

        <a href="${productUrl}" style="display:block;background:linear-gradient(135deg,#16a34a 0%,#15803d 100%);color:#ffffff;text-align:center;padding:15px 24px;border-radius:999px;font-size:15px;font-weight:800;text-decoration:none;letter-spacing:0.04em;box-shadow:0 4px 14px rgba(22,163,74,0.35)">
          View Product →
        </a>
        <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#94a3b8">
          You received this because you are a registered EcoCommerce user.
        </p>
      </div>

      <div style="background:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #f1f5f9">
        <p style="margin:0;font-size:12px;color:#94a3b8">EcoCommerce &mdash; Sustainable shopping, delivered.</p>
      </div>
    </div>
  `;

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < users.length; i += PRODUCT_LAUNCH_BATCH_SIZE) {
    const batch = users.slice(i, i + PRODUCT_LAUNCH_BATCH_SIZE);

    const batchPromises = batch.map((user) =>
      sendEmail(
        user.email,
        `🚀 New Launch: ${product.title} — EcoCommerce`,
        html
      ).then(() => {
        sent += 1;
      }).catch((error) => {
        failed += 1;
        console.error(`[Email] Failed to send launch email to ${user.email}:`, error.message);
      })
    );

    await Promise.allSettled(batchPromises);
  }

  console.log(`[Email] Product launch emails: ${sent} sent, ${failed} failed.`);
};

export const sendOrderStatusEmail = async (order, user, newStatus) => {
  const statusLabels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  const label = statusLabels[newStatus] ?? newStatus;
  const tracking = order.trackingDetails || {};
  const orderCode = String(order._id).slice(-8).toUpperCase();
  const estimatedDelivery = tracking.estimatedDelivery
    ? new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'To be updated';

  const productRows = (order.items ?? [])
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9">${item.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center">${item.quantity}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right">&#8377;${(item.price * item.quantity).toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const trackingLinkHtml = tracking.trackingUrl
    ? `<p style="margin:8px 0 0"><a href="${tracking.trackingUrl}" style="color:#2563eb;text-decoration:none">Track your shipment</a></p>`
    : '';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafb;padding:24px;border-radius:16px">
      <h2 style="color:#1e293b">Order Update — EcoCommerce</h2>
      <p style="color:#475569">Hi <strong>${user.name}</strong>, your order <strong>#${orderCode}</strong> status has been updated.</p>
      <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0;color:#15803d;font-size:18px;font-weight:bold">${label}</p>
      </div>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:12px;overflow:hidden">
        <thead>
          <tr style="background:#f1f5f9">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#64748b">ITEM</th>
            <th style="padding:10px 12px;text-align:center;font-size:12px;color:#64748b">QTY</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#64748b">TOTAL</th>
          </tr>
        </thead>
        <tbody>${productRows}</tbody>
      </table>
      <div style="background:#fff;border:1px solid #e2e8f0;padding:12px 14px;border-radius:10px;color:#334155">
        <p style="margin:0 0 6px"><strong>Order ID:</strong> ${orderCode}</p>
        <p style="margin:0 0 6px"><strong>Shipping Status:</strong> ${label}</p>
        <p style="margin:0 0 6px"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
        <p style="margin:0 0 6px"><strong>Tracking Number:</strong> ${tracking.trackingNumber || 'Not available yet'}</p>
        <p style="margin:0"><strong>Carrier:</strong> ${tracking.carrier || 'Not available yet'}</p>
        ${trackingLinkHtml}
      </div>
      <p style="color:#94a3b8;font-size:12px">EcoCommerce &mdash; Thank you for shopping with us.</p>
    </div>`;

  return await sendEmail(user.email, `Order ${label} #${orderCode} — EcoCommerce`, html);
};
