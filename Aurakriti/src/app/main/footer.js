import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white text-slate-600 pt-16 pb-8 font-sans border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        
        {/* Brand Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-1.5 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C10 14.5 10.5 13 12 13s2 1.5 5 2c3.23.64 5.08 3 5.08 6"/></svg>
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              EcoCommerce
            </span>
          </div>
          <p className="text-slate-500 leading-relaxed text-sm">
            The world&apos;s first carbon-neutral marketplace connecting conscious consumers with verified sustainable brands.
          </p>
          {/* Social Handles */}
          <div className="flex space-x-4 pt-2">
            <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all border border-slate-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all border border-slate-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition-all border border-slate-100">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
          </div> 
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-slate-900 font-bold text-base mb-6 uppercase tracking-wider">Categories</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li><a href="#" className="hover:text-green-600 transition-colors">Eco-Apparel</a></li>
            <li><a href="#" className="hover:text-green-600 transition-colors">Sustainable Tech</a></li>
            <li><a href="#" className="hover:text-green-600 transition-colors">Zero Waste Home</a></li>
            <li><a href="#" className="hover:text-green-600 transition-colors">Organic Beauty</a></li>
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="text-slate-900 font-bold text-base mb-6 uppercase tracking-wider">Support</h3>
          <ul className="space-y-4 text-sm font-medium">
            <li><a href="#" className="hover:text-green-600 transition-colors">Track Order</a></li>
            <li><a href="#" className="hover:text-green-600 transition-colors">Shipping Policy</a></li>
            <li><a href="#" className="hover:text-green-600 transition-colors">Returns & Exchanges</a></li>
            <li><a href="#" className="hover:text-green-600 transition-colors">Help Center</a></li>
          </ul>
        </div>

        {/* Contact Details */}
        <div>
          <h3 className="text-slate-900 font-bold text-base mb-6 uppercase tracking-wider">Contact Us</h3>
          <ul className="space-y-5 text-sm">
            <li className="flex items-start space-x-3">
              <svg className="text-green-600 mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              <span className="text-slate-500 font-medium">Eco Street, Green Valley,<br />California, CA 90210</span>
            </li>
            <li className="flex items-center space-x-3">
              <svg className="text-green-600 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span className="font-semibold text-slate-800">+1 (800) ECO-HELP</span>
            </li>
            <li className="flex items-center space-x-3">
              <svg className="text-green-600 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <a href="mailto:support@ecocommerce.com" className="hover:text-green-600 font-medium">support@ecocommerce.com</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
        <p>© 2026 EcoCommerce. All Rights Reserved.</p>
        <div className="flex space-x-8 mt-4 md:mt-0">
          <a href="#" className="hover:text-green-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-green-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-green-600 transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;