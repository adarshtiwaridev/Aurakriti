'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';

const DEFAULT_PROMPTS = ['Best phone under 15000', 'Gaming laptop', 'Running shoes under 3000'];

export default function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Ask me for product suggestions by budget, category, or use case.',
      recommendations: [],
    },
  ]);
  const viewportRef = useRef(null);
  const runQueryRef = useRef(null);

  useEffect(() => {
    if (!open || !viewportRef.current) {
      return;
    }
    viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
  }, [messages, open]);

  useEffect(() => {
    const onOpenChat = (event) => {
      setOpen(true);
      const nextQuery = String(event.detail?.query || '').trim();
      if (nextQuery && runQueryRef.current) {
        runQueryRef.current(nextQuery);
      }
    };

    window.addEventListener('eco:open-chatbot', onOpenChat);
    return () => window.removeEventListener('eco:open-chatbot', onOpenChat);
  }, []);

  const runQuery = useCallback(async (value) => {
    const text = String(value || '').trim();
    if (!text || loading) {
      return;
    }

    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', text, recommendations: [] },
    ]);

    try {
      const response = await fetch('/api/recommendations/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query: text }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || 'Unable to fetch recommendations');
      }

      const recommendations = payload.data?.recommendations || [];
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: recommendations.length
            ? `Here are ${recommendations.length} products you should consider.`
            : payload.data?.fallbackMessage || 'No exact match found. Try a different query.',
          recommendations,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: error.message || 'Recommendation service is unavailable right now.',
          recommendations: [],
        },
      ]);
    } finally {
      setLoading(false);
      setQuery('');
    }
  }, [loading]);

  useEffect(() => {
    runQueryRef.current = runQuery;
  }, [runQuery]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await runQuery(query);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-200 transition-transform hover:scale-105"
        style={{ zIndex: 70 }}
        aria-label="Open AI shopping assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      <div
        className={`fixed bottom-24 right-5 w-[calc(100vw-2.5rem)] max-w-sm origin-bottom-right rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15 transition-all duration-200 ${
          open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
        style={{ zIndex: 69 }}
      >
        <div className="flex items-center justify-between rounded-t-3xl bg-linear-to-r from-emerald-600 to-green-500 px-4 py-3 text-white">
          <div>
            <p className="flex items-center gap-2 text-sm font-black"><Sparkles size={16} /> AI Shopping Assistant</p>
            <p className="text-xs text-emerald-50">Recommendations, product help, and search shortcuts</p>
          </div>
        </div>

        <div ref={viewportRef} className="space-y-3 overflow-y-auto p-4" style={{ maxHeight: '24rem' }}>
          {messages.map((message) => (
            <div key={message.id} className={message.role === 'user' ? 'text-right' : 'text-left'}>
              <div
                className={`inline-block max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                {message.text}
              </div>

              {message.recommendations?.length ? (
                <div className="mt-2 space-y-2">
                  {message.recommendations.slice(0, 3).map((product) => (
                    <div key={product.id || product._id || product.title} className="rounded-2xl border border-slate-200 p-3 text-left">
                      <p className="text-sm font-bold text-slate-900">{product.title}</p>
                      <p className="mt-1 text-xs text-slate-500">{product.category} | Rs {Number(product.price || 0).toLocaleString('en-IN')}</p>
                      <div className="mt-2 flex gap-2">
                        <Link href={`/products/${product.id || product._id}`} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent('eco:open-chatbot', { detail: { query: product.title } }))}
                          className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                        >
                          Ask more
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
          {loading ? <p className="text-xs text-slate-500">Thinking...</p> : null}
        </div>

        <div className="border-t border-slate-200 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {DEFAULT_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => runQuery(prompt)}
                disabled={loading}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700"
              >
                {prompt}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Ask for recommendations..."
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="submit" disabled={loading || !query.trim()} className="rounded-xl bg-emerald-600 px-3 py-2 text-white disabled:opacity-60">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
