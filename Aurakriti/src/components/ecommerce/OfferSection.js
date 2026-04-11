'use client';

const offerCards = [
  {
    title: 'Clothes',
    subtitle: 'Comfortable sustainable wear',
    image: 'https://images.unsplash.com/photo-1521334884684-d80222895322?auto=format&fit=crop&w=900&q=80',
    label: 'Shop Now',
  },
  {
    title: 'Accessories',
    subtitle: 'Eco-friendly everyday essentials',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    label: 'Shop Now',
  },
  {
    title: 'Electronics',
    subtitle: 'Tech with a green mindset',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
    label: 'Shop Now',
  },
];

export default function OfferSection() {
  return (
    <section className="pt-10 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-green-600">🔥 Trending Offers</p>
            <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">Discover premium deals for every category.</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-500">Selected offers from sustainable collections designed for comfort, style, and impact.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {offerCards.map((offer) => (
            <article
              key={offer.title}
              className="group relative overflow-hidden rounded-4xl bg-slate-900 shadow-2xl shadow-slate-100"
              style={{ minHeight: '320px' }}
            >
              <img
                src={offer.image}
                alt={offer.title}
                className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-950/75 via-slate-950/35 to-transparent" />
              <div className="relative p-8 h-full flex flex-col justify-end">
                <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] text-white/80 backdrop-blur-sm">
                  {offer.title}
                </span>
                <h3 className="mt-4 text-3xl font-black text-white">{offer.title}</h3>
                <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-200">{offer.subtitle}</p>
                <button className="mt-8 inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-black uppercase tracking-[0.18em] text-slate-900 shadow-xl transition hover:-translate-y-1 hover:bg-green-100">
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
