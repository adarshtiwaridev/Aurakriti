'use client';

import { useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/ecommerce/Navbar';
import { useCart } from '@/hooks/useCart';

const SUGGESTIONS = [
  'Best phone under 15000',
  'Gaming laptop',
  'Running shoes under 3000',
  'Men clothing for winter',
];

export default function RecommendationsPage() {
  const { cartCount } = useCart();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Tell me what you want to buy, budget, or category. I will suggest products based on your cart and order history.',
      recommendations: [],
    },
  ]);

  const runQuery = async (text) => {
    const clean = text.trim();
    if (!clean || loading) {
      return;
    }

    setLoading(true);
    setError('');

    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: clean,
        recommendations: [],
      },
    ]);

    try {
      const response = await fetch('/api/recommendations/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query: clean }),
      });

      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Recommendation request failed');
      }

      const data = payload.data || {};
      const recommendations = data.recommendations || [];
      const intro = recommendations.length
        ? `I found ${recommendations.length} recommendations for: "${clean}"`
        : data.fallbackMessage || 'I could not find an exact match, but I can suggest alternatives if you try another query.';

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: intro,
          recommendations,
        },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
      setQuery('');
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await runQuery(query);
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-slate-50 via-white to-emerald-50">
      <Navbar searchTerm="" onSearch={() => {}} cartCount={cartCount} />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900">AI Shopping Assistant</h1>
            <p className="mt-1 text-sm text-slate-600">Smart product recommendations from your behavior, cart, budget, and category intent.</p>
          </div>
          <Link href="/user/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
            Back to Dashboard
          </Link>
        </div>

        <section className="grid gap-6 lg:grid-cols-[300px_1fr]">
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-slate-400">Try These</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((item) => (
                <button
                  key={item}
                  onClick={() => runQuery(item)}
                  disabled={loading}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="max-h-[62vh] space-y-4 overflow-y-auto p-4 sm:p-6">
              {messages.map((msg) => (
                <div key={msg.id} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
                  <div
                    className={`inline-block max-w-[90%] rounded-2xl px-4 py-3 text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'}`}
                  >
                    {msg.text}
                  </div>

                  {msg.recommendations?.length ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {msg.recommendations.map((product) => (
                        <article key={product.id || product._id || product.title} className="rounded-xl border border-slate-200 bg-white p-3 text-left">
                          <img
                            src={product.image || 'https://via.placeholder.com/640x640?text=Product'}
                            alt={product.title}
                            className="h-32 w-full rounded-lg object-cover"
                          />
                          <p className="mt-2 line-clamp-1 text-sm font-black text-slate-900">{product.title}</p>
                          <p className="mt-1 text-xs text-slate-500">{product.category} | Rating: {Number(product.rating || 0).toFixed(1)}</p>
                          <p className="mt-2 text-lg font-black text-emerald-700">Rs {Number(product.price || 0).toLocaleString('en-IN')}</p>
                          <ul className="mt-2 space-y-1 text-xs text-slate-600">
                            {(product.reasons || []).map((reason) => (
                              <li key={`${product.id}-${reason}`}>• {reason}</li>
                            ))}
                          </ul>
                          <div className="mt-3 flex flex-wrap gap-2">
                          <Link href={`/products/${product.id || product._id}`} className="inline-flex rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                            View Product
                          </Link>
                          <button
                            type="button"
                            onClick={() => window.dispatchEvent(new CustomEvent('eco:open-chatbot', { detail: { query: `quick view ${product.title}` } }))}
                            className="inline-flex rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                          >
                            Quick Ask
                          </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}

              {loading ? <p className="text-sm text-slate-500">Thinking...</p> : null}
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
            </div>

            <form onSubmit={onSubmit} className="border-t border-slate-200 p-4 sm:p-6">
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ask e.g. best phone under 15000"
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
                />
                <button type="submit" disabled={loading || !query.trim()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70">
                  Send
                </button>
              </div>
            </form>
          </section>
        </section>
      </main>
    </div>
  );
}
