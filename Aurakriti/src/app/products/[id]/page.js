import ProductClient from './ProductClient';

export async function generateMetadata({ params }) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://aurakriti.vercel.app';
    const response = await fetch(`${baseUrl}/api/products/${params.id}`, {
      cache: 'no-store',
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error('Product not found');
    }

    const product = await response.json();
    const description = product.description
      ? product.description.substring(0, 160)
      : 'Premium jewellery product';

    return {
      title: `${product.title} | Aurakriti`,
      description: description,
      keywords: [product.category, 'jewellery', product.title],
      openGraph: {
        title: `${product.title} | Aurakriti`,
        description: description,
        images: product.images && product.images.length > 0 
          ? [{ url: product.images[0] }]
          : [{ url: `${baseUrl}/og-image.png` }],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Product | Aurakriti',
      description: 'Premium jewellery product on Aurakriti',
      keywords: ['jewellery', 'product'],
    };
  }
}

export default function ProductDetailsPage() {
  return <ProductClient />;
}
