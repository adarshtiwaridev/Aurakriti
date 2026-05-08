import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { sendEmail } from '@/lib/email';
import ContactMessage from '@/models/ContactMessage';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeInput(value) {
  return String(value || '').trim();
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function validatePayload(payload) {
  const name = sanitizeInput(payload?.name);
  const email = sanitizeInput(payload?.email).toLowerCase();
  const message = sanitizeInput(payload?.message);
  const source = sanitizeInput(payload?.source) || 'contact-page';

  if (!name || name.length < 2) {
    return { ok: false, message: 'Please provide a valid name.' };
  }

  if (name.length > 120) {
    return { ok: false, message: 'Name must not exceed 120 characters.' };
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return { ok: false, message: 'Please provide a valid email address.' };
  }

  if (email.length > 200) {
    return { ok: false, message: 'Email must not exceed 200 characters.' };
  }

  if (!message || message.length < 10) {
    return { ok: false, message: 'Message must be at least 10 characters long.' };
  }

  if (message.length > 1500) {
    return { ok: false, message: 'Message must not exceed 1500 characters.' };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      message,
      source: source.slice(0, 60),
    },
  };
}

function buildNotificationEmailHtml(doc) {
  const safeName = escapeHtml(doc.name);
  const safeEmail = escapeHtml(doc.email);
  const safeSource = escapeHtml(doc.source);
  const safeMessage = escapeHtml(doc.message);
  const safeId = escapeHtml(doc._id);

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;background:#fff;border:1px solid #eee;border-radius:12px;">
      <h2 style="margin:0 0 12px;color:#2f241b;">New Contact Inquiry</h2>
      <p style="margin:4px 0;"><strong>Name:</strong> ${safeName}</p>
      <p style="margin:4px 0;"><strong>Email:</strong> ${safeEmail}</p>
      <p style="margin:4px 0;"><strong>Source:</strong> ${safeSource}</p>
      <p style="margin:16px 0 6px;"><strong>Message:</strong></p>
      <div style="white-space:pre-wrap;line-height:1.6;background:#faf7f2;padding:12px;border-radius:8px;">${safeMessage}</div>
      <p style="margin:14px 0 0;color:#777;font-size:12px;">Message ID: ${safeId}</p>
    </div>
  `;
}

export async function POST(request) {
  try {
    const body = await request.json();
    console.debug('[API /contact] Request body received', {
      hasName: Boolean(body?.name),
      hasEmail: Boolean(body?.email),
      messageLength: String(body?.message || '').length,
      source: body?.source,
    });

    const validated = validatePayload(body);
    if (!validated.ok) {
      return NextResponse.json({ success: false, message: validated.message }, { status: 400 });
    }

    await connectDB();

    const savedMessage = await ContactMessage.create(validated.data);

    const contactRecipient = process.env.CONTACT_RECEIVER_EMAIL?.trim() || 'support@aurakriti.com';
    try {
      await sendEmail(
        contactRecipient,
        `New inquiry from ${savedMessage.name} - Aurakriti`,
        buildNotificationEmailHtml(savedMessage)
      );
    } catch (emailError) {
      console.error('[API /contact] Failed to send notification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been received.',
      data: {
        id: String(savedMessage._id),
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('[API /contact] Submission failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to process your message right now.' },
      { status: 500 }
    );
  }
}
