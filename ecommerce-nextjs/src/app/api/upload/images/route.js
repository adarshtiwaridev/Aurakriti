import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';

export const runtime = 'nodejs';

const MAX_FILES = 8;
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(request) {
  const auth = await requireAuth(request);
  if (auth.error) {
    return auth.error;
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll('files');
    const folder = String(formData.get('folder') || 'products');

    if (!files.length) {
      return NextResponse.json({ success: false, message: 'No files provided.' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, message: `Maximum ${MAX_FILES} files allowed.` },
        { status: 400 }
      );
    }

    const uploads = [];

    for (const file of files) {
      if (!(file instanceof File)) {
        continue;
      }

      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ success: false, message: 'Only image files are allowed.' }, { status: 400 });
      }

      if (file.size > MAX_SIZE) {
        return NextResponse.json(
          { success: false, message: `File ${file.name} exceeds 5MB size limit.` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const result = await uploadBufferToCloudinary(buffer, {
        folder: `eco-commerce/${folder}`,
        public_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });

      uploads.push({
        url: result.secure_url,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        files: uploads,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message || 'Image upload failed.' },
      { status: 500 }
    );
  }
}
