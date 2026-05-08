'use client';

import { forwardRef, useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Mail, MapPin, Phone, Send, Sparkles, X } from 'lucide-react';
import { submitContactMessage } from '@/services/contactService';

/* ─── Constants ──────────────────────────────────────────────── */

const INITIAL_FORM = { name: '', email: '', phone: '', subject: '', message: '' };
const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX  = /^[+\d][\d\s\-().]{6,19}$/;
const MAX_MSG      = 1500;
const MIN_MSG      = 10;

/* ─── Animation variants ─────────────────────────────────────── */

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (delay = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] } }),
};

const shimmerVariants = {
  animate: {
    backgroundPosition: ['200% 0%', '-200% 0%'],
    transition: { repeat: Infinity, duration: 3.5, ease: 'linear' },
  },
};

/* ─── Validation ─────────────────────────────────────────────── */

function validateForm(form) {
  const errors = {};
  const name    = form.name.trim();
  const email   = form.email.trim();
  const phone   = form.phone.trim();
  const subject = form.subject.trim();
  const message = form.message.trim();

  if (!name)               errors.name    = 'Please enter your name.';
  else if (name.length < 2) errors.name    = 'Name must be at least 2 characters.';

  if (!email)                    errors.email = 'Please enter your email.';
  else if (!EMAIL_REGEX.test(email)) errors.email = 'Please enter a valid email address.';

  if (phone && !PHONE_REGEX.test(phone))
    errors.phone = 'Please enter a valid phone number.';

  if (!subject)               errors.subject = 'Please enter a subject.';
  else if (subject.length < 3) errors.subject = 'Subject must be at least 3 characters.';

  if (!message)                  errors.message = 'Please tell us how we can help.';
  else if (message.length < MIN_MSG) errors.message = `Please write at least ${MIN_MSG} characters.`;
  else if (message.length > MAX_MSG) errors.message = `Message must not exceed ${MAX_MSG} characters.`;

  return errors;
}

/* ═══════════════════════════════════════════════════════════════
   ContactUs — main component
═══════════════════════════════════════════════════════════════ */

export default function ContactUs() {
  const [form,           setForm          ] = useState(INITIAL_FORM);
  const [errors,         setErrors        ] = useState({});
  const [submitting,     setSubmitting    ] = useState(false);
  const [serverError,    setServerError   ] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);
  const firstErrorRef = useRef(null);

  /* Contact details */
  const details = useMemo(() => [
    {
      icon: Mail,
      label: 'Email',
      value: 'support@aurakriti.com',
      note: 'Replies within 1 business day',
      href: 'mailto:support@aurakriti.com',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '+91 98765 43210',
      note: 'Mon – Sat, 10 AM – 7 PM IST',
      href: 'tel:+919876543210',
    },
    {
      icon: MapPin,
      label: 'Studio',
      value: 'Panipat, Haryana, India',
      note: 'Private appointments available',
      href: null,
    },
  ], []);

  /* Field change handler */
  const onChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev[field] ? { ...prev, [field]: '' } : prev);
    if (serverError) setServerError('');
  }, [serverError]);

  /* Submit handler */
  const onSubmit = async (event) => {
    event.preventDefault();
    setSuccessVisible(false);
    setServerError('');

    const nextErrors = validateForm(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      // Focus first erroneous field after paint
      requestAnimationFrame(() => firstErrorRef.current?.focus());
      return;
    }

    setSubmitting(true);
    try {
      await submitContactMessage({
        name:    form.name.trim(),
        email:   form.email.trim(),
        phone:   form.phone.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
        source:  'contact-page',
      });
      setForm(INITIAL_FORM);
      setSuccessVisible(true);
    } catch (err) {
      console.error('[ContactUs] Submission failed', err);
      setServerError(err?.message || 'Unable to submit your message right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const charCount  = form.message.length;
  const charDanger = charCount > MAX_MSG * 0.9;

  return (
    <div className="relative overflow-hidden bg-[linear-gradient(165deg,#fefaf2_0%,#fff8ee_40%,#fffefb_100%)]">
      {/* Decorative background orbs */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-amber-100/40 blur-[120px]" />
        <div className="absolute bottom-0 -left-24 h-[360px] w-[360px] rounded-full bg-amber-50/60 blur-[100px]" />
      </div>

      <section className="section-container relative py-14 sm:py-20 lg:py-24">
        {/* Page header */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          variants={fadeUp}
          custom={0}
          className="mb-12 text-center lg:mb-16"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/80 bg-amber-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-700">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Get in Touch
          </span>
          <h1 className="mt-5 font-[var(--font-playfair,serif)] text-4xl font-bold leading-tight tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            Let&apos;s find the{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-amber-700">perfect piece</span>
              <motion.span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-1 h-[6px] rounded-full bg-amber-200/70"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              />
            </span>
          </h1>
          <p className="mt-5 mx-auto max-w-2xl text-base leading-relaxed text-stone-500 sm:text-lg">
            Ask about product details, gifting guidance, bridal styling, custom orders, or post-purchase support. Our team replies within 1 business day.
          </p>
        </motion.div>

        {/* Main grid */}
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10 xl:gap-14">

          {/* ── Left panel — Contact info ── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            custom={0.1}
            className="relative overflow-hidden rounded-[2rem] bg-[#2c2117] p-8 text-white shadow-[0_32px_80px_-20px_rgba(44,33,23,0.55)] sm:p-10"
          >
            {/* Shimmer overlay */}
            <motion.div
              aria-hidden="true"
              variants={shimmerVariants}
              animate="animate"
              className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-[0.06]"
              style={{
                background:
                  'linear-gradient(105deg, transparent 20%, rgba(255,215,100,0.9) 50%, transparent 80%)',
                backgroundSize: '400% 100%',
              }}
            />

            {/* Inner background texture */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[2rem] opacity-[0.04]"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-amber-300/80">
                Aurakriti Studio
              </p>
              <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                We&apos;re here to<br className="hidden sm:block" /> help you shine.
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-7 text-stone-300/80 sm:text-[0.9375rem]">
                Reach out via any channel — we&apos;d love to guide you through our collection.
              </p>

              {/* Contact cards */}
              <div className="mt-10 space-y-3">
                {details.map(({ icon: Icon, label, value, note, href }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: -18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.42, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm transition-colors duration-200 hover:border-amber-300/25 hover:bg-white/[0.10]"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-0.5 flex-shrink-0 rounded-xl bg-amber-300/15 p-2.5 text-amber-200 ring-1 ring-amber-200/20 transition-colors group-hover:bg-amber-300/25">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-100/60">
                          {label}
                        </p>
                        {href ? (
                          <a
                            href={href}
                            className="mt-1 block text-[0.9375rem] font-semibold text-white underline-offset-2 transition-colors hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2c2117]"
                          >
                            {value}
                          </a>
                        ) : (
                          <p className="mt-1 text-[0.9375rem] font-semibold text-white">{value}</p>
                        )}
                        <p className="mt-1 text-xs text-stone-400">{note}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Decorative gold rule */}
              <div className="mt-10 flex items-center gap-3" aria-hidden="true">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
                <span className="text-xs text-amber-300/40">✦</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-300/30 to-transparent" />
              </div>
              <p className="mt-5 text-[11px] leading-relaxed text-stone-500">
                All communications are private and handled with the utmost care.
              </p>
            </div>
          </motion.div>

          {/* ── Right panel — Form ── */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={fadeUp}
            custom={0.2}
            className="rounded-[2rem] border border-[#ecdecb] bg-white p-6 shadow-[0_32px_80px_-20px_rgba(147,112,43,0.18)] sm:p-8 lg:p-10"
          >
            <div className="mb-1 flex items-center gap-2">
              <div className="h-1 w-6 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.26em] text-amber-700">Message us</span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-stone-900 sm:text-3xl">
              Send us a message
            </h2>
            <p className="mt-2.5 text-sm leading-7 text-stone-500 sm:text-[0.9375rem]">
              Fill out the form and we&apos;ll respond with product guidance, availability, or order support.
            </p>

            {/* Server error banner */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  key="server-error"
                  role="alert"
                  aria-live="assertive"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5"
                >
                  <X className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" aria-hidden="true" />
                  <p className="text-sm font-medium text-rose-700">{serverError}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Animated success state */}
            <AnimatePresence>
              {successVisible && (
                <motion.div
                  key="success"
                  role="status"
                  aria-live="polite"
                  initial={{ opacity: 0, scale: 0.96, y: -8 }}
                  animate={{ opacity: 1, scale: 1,    y: 0  }}
                  exit={{   opacity: 0, scale: 0.96, y: -8  }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 220 }}
                  >
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-emerald-500" aria-hidden="true" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Message received — thank you!</p>
                    <p className="mt-0.5 text-xs text-emerald-600">
                      We&apos;ll get back to you at your email within 1 business day.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5" aria-label="Contact form">
              {/* Name + Email row */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="contact-name"
                  label="Full Name"
                  required
                  value={form.name}
                  error={errors.name}
                  placeholder="Your full name"
                  onChange={v => onChange('name', v)}
                  disabled={submitting}
                  ref={errors.name ? firstErrorRef : null}
                />
                <Field
                  id="contact-email"
                  label="Email Address"
                  type="email"
                  required
                  value={form.email}
                  error={errors.email}
                  placeholder="you@example.com"
                  onChange={v => onChange('email', v)}
                  disabled={submitting}
                  ref={!errors.name && errors.email ? firstErrorRef : null}
                />
              </div>

              {/* Phone + Subject row */}
              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="contact-phone"
                  label="Phone (optional)"
                  type="tel"
                  value={form.phone}
                  error={errors.phone}
                  placeholder="+91 98765 43210"
                  onChange={v => onChange('phone', v)}
                  disabled={submitting}
                />
                <Field
                  id="contact-subject"
                  label="Subject"
                  required
                  value={form.subject}
                  error={errors.subject}
                  placeholder="e.g. Custom bridal set enquiry"
                  onChange={v => onChange('subject', v)}
                  disabled={submitting}
                />
              </div>

              {/* Message */}
              <div>
                <div className="mb-2 flex items-baseline justify-between">
                  <label
                    htmlFor="contact-message"
                    className="text-sm font-semibold text-stone-800"
                  >
                    Message <span className="text-amber-600" aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </label>
                  <span
                    className={`text-[11px] font-medium tabular-nums transition-colors ${
                      charDanger ? 'text-rose-500' : 'text-stone-400'
                    }`}
                    aria-live="polite"
                    aria-label={`${charCount} of ${MAX_MSG} characters used`}
                  >
                    {charCount}/{MAX_MSG}
                  </span>
                </div>
                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={e => onChange('message', e.target.value)}
                  placeholder="Tell us what you're looking for, your budget, or any order question…"
                  disabled={submitting}
                  aria-required="true"
                  aria-invalid={errors.message ? 'true' : 'false'}
                  aria-describedby={errors.message ? 'contact-message-error' : 'contact-message-hint'}
                  className={`w-full resize-none rounded-2xl border bg-[#fffdfa] px-4 py-3 text-sm leading-relaxed text-stone-900 outline-none transition-all duration-200 placeholder:text-stone-400 focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60 ${
                    errors.message
                      ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                      : 'border-[#e8d8bc] focus:border-[#c9a14a]'
                  }`}
                />
                <div className="mt-1.5 min-h-[18px]">
                  {errors.message ? (
                    <p id="contact-message-error" role="alert" className="text-xs font-medium text-rose-600">
                      {errors.message}
                    </p>
                  ) : (
                    <p id="contact-message-hint" className="text-xs text-stone-400">
                      Minimum {MIN_MSG} characters
                    </p>
                  )}
                </div>
              </div>

              {/* Submit button */}
              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={!submitting ? { scale: 1.015, y: -1 } : {}}
                whileTap={!submitting  ? { scale: 0.985 }         : {}}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                className="group relative mt-1 inline-flex w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-r from-[#c9a14a] via-[#d9b158] to-[#c9a14a] bg-[length:200%_100%] px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_4px_24px_-6px_rgba(201,161,74,0.55)] transition-all duration-300 hover:bg-right hover:shadow-[0_6px_28px_-6px_rgba(201,161,74,0.7)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                aria-label={submitting ? 'Sending your message…' : 'Submit contact message'}
              >
                {/* Shimmer on hover */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 translate-x-[-100%] bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] transition-transform duration-500 group-hover:translate-x-[100%]"
                />
                <span className="relative flex items-center gap-2">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                      Submit Message
                    </>
                  )}
                </span>
              </motion.button>

              <p className="text-center text-[11px] text-stone-400">
                By submitting, you agree to our{' '}
                <a href="/privacy" className="underline underline-offset-2 transition-colors hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                  Privacy Policy
                </a>
                .
              </p>
            </form>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Field — reusable labelled input with inline error
═══════════════════════════════════════════════════════════════ */

const Field = forwardRef(function Field(
  { id, label, value, onChange, error, type = 'text', placeholder, disabled = false, required = false },
  ref
) {
  const hintId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-semibold text-stone-800">
        {label}
        {required && (
          <>
            <span className="ml-0.5 text-amber-600" aria-hidden="true">*</span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      <input
        ref={ref}
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-required={required ? 'true' : undefined}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? hintId : undefined}
        autoComplete={
          type === 'email' ? 'email'
          : type === 'tel' ? 'tel'
          : id === 'contact-name' ? 'name'
          : undefined
        }
        className={`w-full rounded-2xl border bg-[#fffdfa] px-4 py-3 text-sm text-stone-900 outline-none transition-all duration-200 placeholder:text-stone-400 focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60 ${
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
            : 'border-[#e8d8bc] focus:border-[#c9a14a]'
        }`}
      />
      <div className="mt-1.5 min-h-[18px]">
        {error && (
          <p id={hintId} role="alert" className="text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
});
