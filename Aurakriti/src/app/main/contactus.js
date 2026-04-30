'use client';

import { useMemo, useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';

const INITIAL_FORM = {
  name: '',
  email: '',
  message: '',
};

export default function ContactUs() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const details = useMemo(
    () => [
      {
        icon: Mail,
        label: 'Email',
        value: 'support@aurakriti.com',
        note: 'Replies within 1 business day',
      },
      {
        icon: Phone,
        label: 'Phone',
        value: '+91 98765 43210',
        note: 'Mon to Sat, 10 AM to 7 PM',
      },
      {
        icon: MapPin,
        label: 'Studio',
        value: 'Panipat, Haryana, India',
        note: 'Private appointments available',
      },
    ],
    []
  );

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Please enter your name.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Please enter your email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!form.message.trim()) {
      nextErrors.message = 'Please tell us how we can help.';
    } else if (form.message.trim().length < 10) {
      nextErrors.message = 'Please share at least 10 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(false);

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      console.log('Contact form submitted', form);
      await new Promise((resolve) => setTimeout(resolve, 600));
      setForm(INITIAL_FORM);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ea_38%,#ffffff_100%)]">
      <section className="section-container py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-[#2f241b] p-8 text-white shadow-[0_30px_80px_-45px_rgba(47,36,27,0.7)] sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
              Contact Us
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Let&apos;s help you find the right piece.
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-7 text-stone-200 sm:text-base">
              Ask about product details, gifting guidance, bridal styling, custom orders,
              or post-purchase support. We&apos;ll point you to the fastest next step.
            </p>

            <div className="mt-10 space-y-4">
              {details.map(({ icon: Icon, label, value, note }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-300/15 p-2 text-amber-200">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">
                        {label}
                      </p>
                      <p className="mt-1 text-base font-semibold text-white">{value}</p>
                      <p className="mt-1 text-sm text-stone-300">{note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-[0_30px_80px_-45px_rgba(147,112,43,0.35)] sm:p-8 lg:p-10">
            <div className="max-w-xl">
              <h2 className="text-2xl font-semibold text-stone-900 sm:text-3xl">
                Send us a message
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-500 sm:text-base">
                Fill out the form and we&apos;ll get back to you with product guidance,
                availability, or order support.
              </p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  label="Name"
                  value={form.name}
                  error={errors.name}
                  placeholder="Your full name"
                  onChange={(value) => onChange('name', value)}
                />
                <Field
                  label="Email"
                  type="email"
                  value={form.email}
                  error={errors.email}
                  placeholder="you@example.com"
                  onChange={(value) => onChange('email', value)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-800">
                  Message
                </label>
                <textarea
                  rows={6}
                  value={form.message}
                  onChange={(event) => onChange('message', event.target.value)}
                  placeholder="Tell us what you're looking for, your budget, or any order question."
                  className={`w-full rounded-2xl border bg-[#fffdfa] px-4 py-3 text-sm text-stone-900 outline-none transition focus:ring-4 focus:ring-amber-100 ${
                    errors.message ? 'border-rose-300' : 'border-[#eadfce] focus:border-[#c9a14a]'
                  }`}
                />
                {errors.message ? (
                  <p className="mt-1 text-xs font-medium text-rose-600">{errors.message}</p>
                ) : null}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-full bg-[#c9a14a] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#b88f37] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Send className="mr-2 h-4 w-4" />
                {submitting ? 'Sending...' : 'Submit Message'}
              </button>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  Thanks for reaching out. We&apos;ve recorded your message and will respond soon.
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, error, type = 'text', placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-stone-800">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border bg-[#fffdfa] px-4 py-3 text-sm text-stone-900 outline-none transition focus:ring-4 focus:ring-amber-100 ${
          error ? 'border-rose-300' : 'border-[#eadfce] focus:border-[#c9a14a]'
        }`}
      />
      {error ? <p className="mt-1 text-xs font-medium text-rose-600">{error}</p> : null}
    </div>
  );
}
