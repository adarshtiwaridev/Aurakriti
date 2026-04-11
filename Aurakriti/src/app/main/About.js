import React from 'react';

const HD_IMAGES = {
  hero: 'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1920&q=85&auto=format&fit=crop',
  gallery1: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=900&q=85&auto=format&fit=crop',
  gallery2: 'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=900&q=85&auto=format&fit=crop',
  gallery3: 'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=900&q=85&auto=format&fit=crop',
};

const About = () => {
  return (
    <div className="min-h-screen bg-[#fffcf8] text-[#3d2f24]">

      {/* Hero Banner */}
      <div className="relative h-[45vh] min-h-[320px] overflow-hidden">
        <img
          src={HD_IMAGES.hero}
          alt="Aurakriti jewellery collection"
          className="h-full w-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2c1f10]/60 via-[#2c1f10]/30 to-[#fffcf8]" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-[#f5d98b] mb-3">Est. 2020</p>
          <h1 className="luxury-serif text-4xl sm:text-6xl text-white drop-shadow-lg">Our Story</h1>
          <p className="mt-3 text-[#f0e0c0] text-sm sm:text-base max-w-lg">
            Crafting jewellery that honours tradition and celebrates modern women
          </p>
        </div>
      </div>

      {/* Two-Column Section */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">

          {/* Image Left */}
          <div className="relative overflow-hidden rounded-[2rem] shadow-[0_30px_80px_-30px_rgba(60,30,10,0.35)]">
            <img
              src={HD_IMAGES.gallery1}
              alt="Aurakriti artisans at work"
              className="h-[480px] w-full object-cover object-center"
              loading="lazy"
            />
            <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-white/90 backdrop-blur-sm px-5 py-3 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#9f7a40]">Handcrafted in India</p>
              <p className="luxury-serif text-lg text-[#3d2f24]">Every piece, a masterpiece</p>
            </div>
          </div>

          {/* Text Right */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9f7a40] mb-4">About Aurakriti</p>
            <h2 className="luxury-serif text-4xl sm:text-5xl leading-tight">
              Timeless artistry,<br />modern grace
            </h2>
            <p className="mt-6 text-base leading-8 text-[#6b5645]">
              Aurakriti began as a dream born in the heart of India&apos;s finest jewellery studios — to bring
              together the richness of traditional craftsmanship with the clean elegance of contemporary design.
            </p>
            <p className="mt-4 text-base leading-8 text-[#6b5645]">
              From bridal chokers to contemporary necklaces, every piece is designed to feel luxurious, radiant,
              and deeply personal — crafted for life&apos;s most meaningful moments.
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-3 gap-4">
              {[
                { value: '5000+', label: 'Happy Brides' },
                { value: '200+', label: 'Unique Designs' },
                { value: '15+', label: 'Years of Craft' },
              ].map(({ value, label }) => (
                <div key={label} className="rounded-2xl border border-[#eadfce] bg-white p-4 text-center shadow-sm">
                  <p className="luxury-serif text-2xl text-[#c9a14a] font-bold">{value}</p>
                  <p className="mt-1 text-xs text-[#9b7a48]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Row */}
      <section className="mx-auto max-w-7xl px-6 pb-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="overflow-hidden rounded-[1.5rem] shadow-md">
            <img
              src={HD_IMAGES.gallery2}
              alt="Bridal necklace collection"
              className="h-64 w-full object-cover object-center hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          </div>
          <div className="overflow-hidden rounded-[1.5rem] shadow-md">
            <img
              src={HD_IMAGES.gallery3}
              alt="Luxury jewellery display"
              className="h-64 w-full object-cover object-center hover:scale-105 transition-transform duration-700"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-10">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#9f7a40] mb-3">Why Aurakriti</p>
          <h2 className="luxury-serif text-3xl sm:text-4xl text-[#3d2f24]">Our Promise to You</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              icon: '✦',
              title: 'Handcrafted Excellence',
              text: 'Each clasp, stone, and setting is meticulously finished by skilled artisans who have devoted their lives to the craft.',
            },
            {
              icon: '◈',
              title: 'Premium Materials',
              text: 'We source only the finest — lustrous metals, brilliant gemstones, and durable clasps — curated for lasting beauty.',
            },
            {
              icon: '❋',
              title: 'Bridal Boutique Feel',
              text: "A clean, luxurious shopping experience inspired by the world's finest jewellery boutiques, delivered to your door.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-[1.8rem] border border-[#eadfce] bg-white p-7 shadow-[0_18px_55px_-40px_rgba(147,112,43,0.28)] hover:shadow-[0_25px_60px_-30px_rgba(147,112,43,0.38)] transition-shadow"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#fff4de] text-[#c9a14a] text-xl font-bold">
                {item.icon}
              </div>
              <h3 className="luxury-serif text-xl text-[#2f241b] mb-3">{item.title}</h3>
              <p className="text-sm leading-7 text-[#6b5645]">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

    </div>
  );
};

export default About;
