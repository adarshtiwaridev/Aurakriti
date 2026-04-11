'use client';

export default function CategoryBar({ categories, activeCategory, onChange }) {
  return (
    <div className="overflow-x-auto py-4">
      <div className="inline-flex gap-3 px-4 sm:px-0">
        {categories.map((category) => {
          const active = category === activeCategory;
          return (
            <button
              key={category}
              onClick={() => onChange(category)}
              className={`whitespace-nowrap rounded-full border px-5 py-2 text-sm font-semibold transition ${
                active
                  ? 'border-green-600 bg-green-600 text-white shadow-lg shadow-green-100'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-green-200 hover:bg-green-50'
              }`}
            >
              {category}
            </button>
          );
        })}
      </div>
    </div>
  );
}
