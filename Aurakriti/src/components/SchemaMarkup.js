import { headers } from 'next/headers';

export default function SchemaMarkup({ type = 'Organization', data = {} }) {
  const nonce = headers().get('x-nonce') || undefined;
  let schema = {};

  if (type === 'Organization') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Aurakriti',
      url: 'https://aurakriti.vercel.app',
      logo: 'https://aurakriti.vercel.app/logo.png',
      description: 'Premium jewellery ecommerce platform',
      sameAs: [
        'https://www.facebook.com/aurakriti',
        'https://www.instagram.com/aurakriti',
        'https://twitter.com/aurakriti',
        'https://www.linkedin.com/company/aurakriti',
      ],
    };
  } else if (type === 'Product') {
    const { name, description, image, price, rating, ratingCount, stock } = data;
    
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: name || 'Product',
      description: description || '',
      image: image || '',
      brand: {
        '@type': 'Brand',
        name: 'Aurakriti',
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'INR',
        price: price || '0',
        availability: stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      },
    };

    if (rating && ratingCount) {
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rating,
        ratingCount: ratingCount,
      };
    }
  } else if (type === 'BreadcrumbList') {
    const { items = [] } = data;
    
    schema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    };
  }

  return (
    <script
      nonce={nonce}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
