import React from 'react';

const ContactUs = () => {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans pt-24">
      {/* --- Header Section --- */}
      <section className="max-w-7xl mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
          Get in <span className="text-green-600">Touch</span>
        </h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg">
          Have questions about our sustainable marketplace? Our team in Panipat is here to help you 24/7.
        </p>
      </section>

      {/* --- Main Content --- */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Side: Contact Form */}
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
            <h2 className="text-2xl font-bold mb-6 text-slate-800">Send us a message</h2>
            <form className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input type="text" placeholder="John Doe" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-slate-50" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input type="email" placeholder="john@example.com" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-slate-50" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Subject</label>
                <input type="text" placeholder="How can we help?" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-slate-50" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                <textarea rows="5" placeholder="Tell us more about your inquiry..." className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-slate-50 resize-none"></textarea>
              </div>
              <button className="w-full bg-green-600 text-white font-bold py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-200">
                Send Message
              </button>
            </form>
          </div>

          {/* Right Side: Contact Info & Map */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-600 p-6 rounded-3xl text-white">
                <div className="mb-4 bg-white/20 w-10 h-10 rounded-lg flex items-center justify-center">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <h3 className="font-bold text-lg">Call Us</h3>
                <p className="text-green-100 text-sm mt-1">+91 98765 43210</p>
              </div>
              <div className="bg-slate-900 p-6 rounded-3xl text-white">
                <div className="mb-4 bg-white/10 w-10 h-10 rounded-lg flex items-center justify-center">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                </div>
                <h3 className="font-bold text-lg">Email Us</h3>
                <p className="text-slate-400 text-sm mt-1">hello@ecocommerce.com</p>
              </div>
            </div>

            {/* Panipat Map Embed */}
            <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-lg h-[350px] relative">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d110125.10912166948!2d76.89069330689844!3d29.39094389062025!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390dd9623e659b9d%3A0xc47efca221446777!2sPanipat%2C%20Haryana!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade">
              </iframe>
              <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-xl shadow-md border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Our HQ</p>
                <p className="text-sm font-bold text-slate-800">Panipat, Haryana, India</p>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default ContactUs;