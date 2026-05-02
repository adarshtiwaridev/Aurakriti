'use client';

 
import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, Loader2 } from 'lucide-react';

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMsg, setErrorMsg] = useState('');

  const validateForm = () => {
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      return 'All fields are required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      return 'Please enter a valid email address.';
    }
    if (form.message.length < 10) {
      return 'Message must be at least 10 characters long.';
    }
    if (form.message.length > 500) {
      return 'Message cannot exceed 500 characters.';
    }
    return null;
 
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
 
    const validationError = validateForm();
    
    if (validationError) {
      setStatus('error');
      setErrorMsg(validationError);
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    // Simulate backend connection / processing
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    }, 1500);
  };

  return (
    <div className="bg-[#fffcf8] text-[#3d2f24] font-light">
      
      {/* Luxury Split Header */}
      <section className="relative w-full h-[25vh] sm:h-[30vh] lg:h-[35vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#2f241b]">
          <div 
            className="w-full h-full bg-cover bg-center bg-no-repeat opacity-60 scale-105"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1601121141461-9d6647bef0a0?w=1920&q=85&auto=format&fit=crop')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#fffcf8] via-[#1a0f08]/20 to-[#1a0f08]/40"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 pt-8">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.5em] text-white/90 mb-3 luxury-serif drop-shadow-sm">
            Contact Us
          </p>
          <h1 className="luxury-serif text-4xl sm:text-5xl lg:text-6xl text-white drop-shadow-lg">
            Book a Consultation
          </h1>
        </div>
      </section>

      <section className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 -mt-8 pb-20 lg:-mt-10 lg:pb-28">
        <div className="grid gap-12 lg:gap-0 lg:grid-cols-[1fr_0.8fr] items-stretch shadow-[0_30px_80px_-20px_rgba(47,36,27,0.1)] bg-white rounded-none">
          
          {/* Left Form Panel */}
          <form onSubmit={onSubmit} className="p-8 sm:p-14 lg:p-20 relative bg-white">
            <div className="mb-12">
              <h2 className="text-3xl sm:text-4xl luxury-serif mb-4 text-[#2f241b]">Send an Inquiry</h2>
              <p className="text-sm sm:text-base leading-loose text-[#6b5645] font-light max-w-md">
                Share your design preference and our team will help you find the perfect piece for your occasion.
              </p>
            </div>
            
            {status === 'error' && (
              <div role="alert" className="mb-8 rounded bg-red-50/50 p-4 text-sm text-red-800 border border-red-100">
                {errorMsg}
              </div>
            )}
            
            {status === 'success' && (
              <div role="status" className="mb-8 rounded bg-green-50/50 p-4 text-sm text-green-800 border border-green-100">
                Thank you! Your message has been sent successfully. We will be in touch shortly.
              </div>
            )}

            <div className="grid gap-10 sm:grid-cols-2 content-start">
              <div className="flex flex-col gap-2 relative">
                <input
                  id="name"
                  type="text"
                  placeholder=" "
                  required
                  aria-invalid={status === 'error'}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="peer h-10 w-full border-0 border-b border-[#eadfce] bg-transparent px-0 text-base text-[#2f241b] outline-none transition-all focus:border-[#c9a14a] focus:ring-0 disabled:opacity-60 placeholder-transparent"
                  disabled={status === 'loading'}
                />
                <label htmlFor="name" className="absolute left-0 top-2 text-base text-[#8c7b6d] transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-4 peer-[&:not(:placeholder-shown)]:-top-4 peer-focus:text-[10px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-focus:uppercase peer-[&:not(:placeholder-shown)]:uppercase peer-focus:tracking-[0.2em] peer-[&:not(:placeholder-shown)]:tracking-[0.2em] peer-focus:text-[#c9a14a] peer-focus:font-medium pointer-events-none">
                  Full Name
                </label>
              </div>

              <div className="flex flex-col gap-2 relative">
                <input
                  id="email"
                  type="email"
                  placeholder=" "
                  required
                  aria-invalid={status === 'error'}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="peer h-10 w-full border-0 border-b border-[#eadfce] bg-transparent px-0 text-base text-[#2f241b] outline-none transition-all focus:border-[#c9a14a] focus:ring-0 disabled:opacity-60 placeholder-transparent"
                  disabled={status === 'loading'}
                />
                <label htmlFor="email" className="absolute left-0 top-2 text-base text-[#8c7b6d] transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-4 peer-[&:not(:placeholder-shown)]:-top-4 peer-focus:text-[10px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-focus:uppercase peer-[&:not(:placeholder-shown)]:uppercase peer-focus:tracking-[0.2em] peer-[&:not(:placeholder-shown)]:tracking-[0.2em] peer-focus:text-[#c9a14a] peer-focus:font-medium pointer-events-none">
                  Email Address
                </label>
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2 relative mt-4">
                <textarea
                  id="message"
                  rows={4}
                  placeholder=" "
                  required
                  maxLength={500}
                  aria-invalid={status === 'error'}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="peer w-full border-0 border-b border-[#eadfce] bg-transparent px-0 py-2 text-base text-[#2f241b] outline-none transition-all focus:border-[#c9a14a] focus:ring-0 resize-none min-h-[100px] disabled:opacity-60 placeholder-transparent"
                  disabled={status === 'loading'}
                />
                <label htmlFor="message" className="absolute left-0 top-2 text-base text-[#8c7b6d] transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-focus:-top-4 peer-[&:not(:placeholder-shown)]:-top-4 peer-focus:text-[10px] peer-[&:not(:placeholder-shown)]:text-[10px] peer-focus:uppercase peer-[&:not(:placeholder-shown)]:uppercase peer-focus:tracking-[0.2em] peer-[&:not(:placeholder-shown)]:tracking-[0.2em] peer-focus:text-[#c9a14a] peer-focus:font-medium pointer-events-none">
                  Your Message
                </label>
                <span className="absolute right-0 -bottom-6 text-[10px] tracking-[0.1em] text-[#9f7a40] opacity-0 peer-focus:opacity-100 transition-opacity">
                  {form.message.length}/500
                </span>
              </div>
 
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


            <button
              type="submit"
              disabled={status === 'loading' || status === 'success'}
              className="mt-14 flex h-14 w-full sm:w-auto sm:px-14 items-center justify-center gap-3 bg-[#2f241b] text-[11px] font-medium uppercase tracking-[0.25em] text-white transition-all hover:bg-[#c9a14a] disabled:pointer-events-none disabled:opacity-70 group"
            >
              {status === 'loading' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span className="translate-y-[1px]">Send Message</span>
                  <Send className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" strokeWidth={1.5} />
                </>
              )}
            </button>
          </form>

          {/* Right Contact Info Panel */}
          <div className="bg-[#f0ebe1] p-10 sm:p-14 lg:p-20 flex flex-col justify-center relative shadow-inner">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
            
            <h2 className="luxury-serif text-3xl sm:text-4xl text-[#2f241b]">Aurakriti Studio</h2>
            <p className="mt-8 text-sm sm:text-base leading-loose text-[#6b5645] font-light max-w-sm">
              Experience our bridal collections in person. Enjoy exclusive previews and styling assistance.
            </p>
            
            <div className="my-12 h-[1px] w-16 bg-[#c9a14a]"></div>
            
            <div className="space-y-10 text-[#2f241b]">
              <div className="flex items-start gap-6 group cursor-pointer">
                <div className="mt-1 text-[#c9a14a] group-hover:scale-110 transition-transform duration-500">
                  <Mail strokeWidth={1} className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9f7a40] mb-3">Email Enquiries</p>
                  <a href="mailto:support@aurakriti.com" className="text-[15px] hover:text-[#c9a14a] transition-colors">
                    support@aurakriti.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group cursor-pointer">
                <div className="mt-1 text-[#c9a14a] group-hover:scale-110 transition-transform duration-500">
                  <Phone strokeWidth={1} className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9f7a40] mb-3">Phone Support</p>
                  <a href="tel:+919876543210" className="text-[15px] hover:text-[#c9a14a] transition-colors">
                    +91 98765 43210
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-6 group cursor-pointer">
                <div className="mt-1 text-[#c9a14a] group-hover:scale-110 transition-transform duration-500">
                  <MapPin strokeWidth={1} className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#9f7a40] mb-3">Boutique Location</p>
                  <address className="text-[15px] not-italic leading-loose">
                    Aurakriti Jewellery Studio<br />
                    Panipat, Haryana, India
                  </address>
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
