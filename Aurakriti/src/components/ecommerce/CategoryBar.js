'use client';

export default function CategoryBar({ categories, activeCategory, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {categories.map((category) => {
        const active = category === activeCategory;
        return (
          <button
            key={category}
            type="button"
            onClick={() => onChange(category)}
            className={`group rounded-3xl border px-6 py-7 text-center transition duration-300 ${
              active
                ? 'border-[#c9a14a] bg-[#fff4de] shadow-[0_16px_40px_-28px_rgba(147,112,43,0.38)]'
                : 'border-[#eadfce] bg-[#fffdfa] hover:scale-[1.02] hover:brightness-105'
            }`}
          >
            <p className="luxury-serif text-2xl text-[#3b2f24]">{category}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#9a7b49]">Collection</p>
          </button>
        );
      })}
    </div>
  );
}
