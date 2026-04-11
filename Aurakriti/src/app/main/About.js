import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-900 font-sans">
      
      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-green-100">
              Our Journey
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
              We’re on a mission to <span className="text-green-600">heal the planet</span> through retail.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              EcoCommerce started with a simple question: Can we shop without leaving a footprint? Today, we connect over 50,000 conscious consumers with verified sustainable brands.
            </p>
            <div className="flex gap-4">
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100 min-w-[100px]">
                <div className="text-2xl font-bold text-green-600">50K+</div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Users</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100 min-w-[100px]">
                <div className="text-2xl font-bold text-green-600">200+</div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Brands</div>
              </div>
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100 min-w-[100px]">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-xs text-slate-500 font-semibold uppercase">Carbon</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-green-100 overflow-hidden shadow-2xl relative">
               {/* Placeholder for an image - Using a styled div to mimic a premium look */}
               <div className="absolute inset-0 bg-gradient-to-tr from-green-600/20 to-transparent"></div>
               <div className="flex items-center justify-center h-full">
                  <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C10 14.5 10.5 13 12 13s2 1.5 5 2c3.23.64 5.08 3 5.08 6"/></svg>
               </div>
            </div>
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 hidden md:block">
              <p className="text-sm font-bold text-slate-900 italic">&quot;The best for the world, not just in the world.&quot;</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Values Section --- */}
      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Core Values</h2>
          <p className="text-slate-500">Every decision we make is guided by our commitment to the environment and our community.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-green-200 hover:shadow-2xl hover:shadow-green-50/50 transition-all duration-300">
            <div className="bg-green-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-green-600 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Radical Transparency</h3>
            <p className="text-slate-600 leading-relaxed text-sm">We believe you deserve to know where your products come from and how they are made.</p>
          </div>

          {/* Card 2 */}
          <div className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-50/50 transition-all duration-300">
            <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Community First</h3>
            <p className="text-slate-600 leading-relaxed text-sm">Our marketplace is built by activists, for activists. Your voice shapes our catalog.</p>
          </div>

          {/* Card 3 */}
          <div className="group p-8 rounded-3xl bg-white border border-slate-100 hover:border-purple-200 hover:shadow-2xl hover:shadow-purple-50/50 transition-all duration-300">
            <div className="bg-purple-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-purple-600 group-hover:scale-110 transition-transform">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Future Focused</h3>
            <p className="text-slate-600 leading-relaxed text-sm">We don&apos;t just solve today&apos;s problems; we invest in the technology of tomorrow.</p>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
          {/* Decorative Background Circles */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
            Ready to change the way <br />you shop?
          </h2>
          <p className="text-slate-400 mb-10 max-w-xl mx-auto relative z-10">
            Join thousands of others making an impact with every purchase. Sign up for our eco-newsletter or start browsing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button className="bg-green-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-900/20">
              Join the Community
            </button>
            <button className="bg-white/10 text-white backdrop-blur-md px-8 py-4 rounded-2xl font-bold hover:bg-white/20 transition-all">
              Read Our Reports
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;