import path from 'path';
import { promises as fs } from 'fs';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function POST(request) {
  const auth = await requireRole(request, ['user', 'seller', 'admin']);
  if (auth.error) {
    return auth.error;
  }

  try {
    const body = await request.json();
    const { to, subject, html, invoicePath, attachments = [] } = body;

    if (!to || !subject || !html) {
      return NextResponse.json({ success: false, message: 'to, subject and html are required.' }, { status: 400 });
    }

    const normalizedAttachments = [...attachments];
    if (invoicePath) {
      const resolvedPath = path.join(process.cwd(), invoicePath.startsWith('/') ? invoicePath.slice(1) : invoicePath);
      try {
        await fs.access(resolvedPath);
        normalizedAttachments.push({
          filename: path.basename(resolvedPath),
          path: resolvedPath,
        });
      } catch {
        console.warn('[Email/Send] invoicePath not found:', resolvedPath);
      }
    }

    const result = await sendEmail(to, subject, html, { attachments: normalizedAttachments });

    console.log('[Email/Send] Sent:', {
      to,
      subject,
      attachmentCount: normalizedAttachments.length,
      by: String(auth.user._id),
    });

    return NextResponse.json({
      success: true,
      data: {
        messageId: result?.messageId || null,
      },
    });
  } catch (error) {
    console.error('POST /api/email/send failed:', error);
    return NextResponse.json({ success: false, message: error.message || 'Unable to send email.' }, { status: 500 });
  }
}
