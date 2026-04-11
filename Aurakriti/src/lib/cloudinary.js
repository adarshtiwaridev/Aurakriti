import { v2 as cloudinary } from 'cloudinary';

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || 'eco-commerce';

function ensureConfigured() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  return true;
}

function makeMockUrl(name) {
  const encoded = encodeURIComponent(name || `file-${Date.now()}.jpg`);
  return `https://via.placeholder.com/800x800.png?text=${encoded}`;
}

export async function uploadBufferToCloudinary(buffer, options = {}) {
  const configured = ensureConfigured();

  if (!configured) {
    return {
      secure_url: makeMockUrl(options.public_id || 'upload'),
      public_id: `mock_${Date.now()}`,
      bytes: buffer?.length || 0,
      format: 'jpg',
      mock: true,
    };
  }

  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || CLOUDINARY_FOLDER,
        resource_type: 'image',
        public_id: options.public_id,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    upload.end(buffer);
  });
}
