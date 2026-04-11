'use client';

import Image from 'next/image';

const offerCards = [
  {
    title: 'Golden Choker Collection',
    subtitle: 'Delicate designs with premium gold finishes.',
    image: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=900&q=80',
    label: 'Explore Now',
  },
  {
    title: 'Timeless Necklaces',
    subtitle: 'Crafted for bridal elegance and everyday luxury.',
    image: 'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80',
    label: 'Shop Collection',
  },
  {
    title: 'Signature Watches',
    subtitle: 'Polished gold timepieces with classic appeal.',
    image: 'https://images.unsplash.com/photo-1518546305925-79f9aa5e6d84?auto=format&fit=crop&w=900&q=80',
    label: 'View Range',
  },
];

export default function OfferSection() {
  return (
    <section className="pt-10 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-[#a77d2f]">✨ Exclusive Gold Picks</p>
            <h2 className="mt-3 text-3xl font-black text-[#372819] sm:text-4xl">Discover the golden touch in every piece.</h2>
          </div>
          <p className="max-w-xl text-sm text-[#5c4b38]">Curated jewellery collections with warm gold tones, luxurious textures, and elegant craftsmanship.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {offerCards.map((offer) => (
            <article
              key={offer.title}
              className="group relative overflow-hidden rounded-[2rem] bg-[#fff5e7] shadow-[0_30px_80px_-55px_rgba(193,150,70,0.35)]"
              style={{ minHeight: '320px' }}
            >
              <Image
                src={offer.image}
                alt={offer.title}
                fill
                sizes="(max-width: 768px) 100vw, 33vw"
                className="absolute inset-0 object-cover transition duration-700 group-hover:scale-105"
                priority={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2b1f12]/80 via-[#3e2b18]/35 to-transparent" />
              <div className="relative p-8 h-full flex flex-col justify-end">
                <span className="inline-flex items-center rounded-full bg-[#fff2dd]/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-[#735c3d] backdrop-blur-sm">
                  {offer.title}
                </span>
                <h3 className="mt-4 text-3xl font-black text-white">{offer.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#f2e7d5]">{offer.subtitle}</p>
                <button className="mt-8 inline-flex items-center rounded-full bg-[#c9a14a] px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl transition hover:bg-[#d4af37]">
                  {offer.label}
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
