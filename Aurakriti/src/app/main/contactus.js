'use client';

import React, { useState } from 'react';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    setForm({ name: '', email: '', message: '' });
    setTimeout(() => setSubmitted(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#fffcf8] pt-24 text-[#3d2f24]">
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#9f7a40]">Contact Us</p>
          <h1 className="luxury-serif mt-4 text-4xl sm:text-5xl">Book your jewellery consultation</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-[#6b5645]">
            Share your design preference and our Aurakriti team will help you find the perfect piece for your occasion.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={onSubmit} className="rounded-4xl border border-[#eadfce] bg-white p-6 shadow-[0_24px_70px_-45px_rgba(147,112,43,0.28)] sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Name"
                required
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                className="h-12 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 text-sm text-[#4b3a2e] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#c9a14a1f]"
              />
              <input
                type="email"
                placeholder="Email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                className="h-12 rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 text-sm text-[#4b3a2e] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#c9a14a1f]"
              />
              <textarea
                rows={6}
                placeholder="Message"
                required
                value={form.message}
                onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
                className="rounded-2xl border border-[#eadfce] bg-[#fffdfa] px-4 py-3 text-sm text-[#4b3a2e] outline-none transition focus:border-[#c9a14a] focus:ring-4 focus:ring-[#c9a14a1f] sm:col-span-2"
              />
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#c9a14a] text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#b88f37]"
            >
              Submit
            </button>

            {submitted ? (
              <p className="mt-4 text-center text-sm font-semibold text-[#8a6b3b]">Thank you. We will contact you shortly.</p>
            ) : null}
          </form>

          <div className="rounded-4xl bg-[#f9f0e3] p-6 sm:p-8">
            <h2 className="luxury-serif text-3xl">Aurakriti Studio</h2>
            <p className="mt-4 text-sm leading-7 text-[#6b5645]">
              Visit our bridal jewellery studio for exclusive previews, custom styling assistance, and one-to-one design consultation.
            </p>
            <div className="mt-6 space-y-3 text-sm text-[#5f4b38]">
              <p><strong>Email:</strong> support@aurakriti.com</p>
              <p><strong>Phone:</strong> +91 98765 43210</p>
              <p><strong>Address:</strong> Panipat, Haryana, India</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUs;
