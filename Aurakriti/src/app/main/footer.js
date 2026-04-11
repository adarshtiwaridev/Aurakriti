import React from 'react';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="bg-[#2c1f16] text-[#c9b99a] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* Brand */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#c9a14a]/30 bg-[#3d2f24]">
              <span style={{ fontFamily: 'serif' }} className="text-lg font-semibold text-[#c9a14a]">A</span>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.4em] text-[#9b7a48]">Aurakriti</p>
              <p className="text-base font-semibold tracking-wider text-[#f5e6cf]">Bridal Jewellery</p>
            </div>
          </div>
          <p className="text-sm leading-7 text-[#a08868]">
            Handcrafted jewellery celebrating elegance, tradition, and modern grace. Each piece tells a timeless story.
          </p>
          <div className="flex gap-3 pt-1">
            {/* Instagram */}
            <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5a3e2c] bg-[#3d2f24] text-[#c9a14a] hover:border-[#c9a14a] hover:bg-[#c9a14a] hover:text-white transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
            </a>
            {/* Facebook */}
            <a href="#" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5a3e2c] bg-[#3d2f24] text-[#c9a14a] hover:border-[#c9a14a] hover:bg-[#c9a14a] hover:text-white transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
            </a>
            {/* Pinterest */}
            <a href="#" aria-label="Pinterest" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#5a3e2c] bg-[#3d2f24] text-[#c9a14a] hover:border-[#c9a14a] hover:bg-[#c9a14a] hover:text-white transition-all">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.87 6.39 9.29-.09-.78-.17-1.98.04-2.83.18-.77 1.23-5.2 1.23-5.2s-.31-.63-.31-1.56c0-1.46.85-2.55 1.9-2.55.9 0 1.33.67 1.33 1.48 0 .9-.58 2.26-.87 3.52-.25 1.05.52 1.9 1.54 1.9 1.85 0 3.27-1.95 3.27-4.77 0-2.49-1.79-4.23-4.35-4.23-2.96 0-4.7 2.22-4.7 4.52 0 .9.34 1.85.77 2.37.08.1.09.19.07.29-.08.32-.25 1.05-.28 1.19-.04.17-.14.21-.32.13C5.7 14.93 5 13.06 5 11.3 5 8.19 7.38 5 12 5c3.73 0 6.63 2.66 6.63 6.2 0 3.7-2.33 6.68-5.56 6.68-1.09 0-2.11-.57-2.46-1.24l-.67 2.49c-.24.93-.89 2.1-1.33 2.81.99.31 2.05.48 3.14.48 5.52 0 10-4.48 10-10S17.52 2 12 2z"/></svg>
            </a>
          </div>
        </div>

        {/* Collections */}
        <div>
          <h3 className="text-[#f5e6cf] font-bold text-sm mb-5 uppercase tracking-[0.2em]">Collections</h3>
          <ul className="space-y-3 text-sm">
            {['Choker Sets', 'Bridal Necklaces', 'Mangalsutra', 'Luxury Watches', 'New Arrivals'].map((item) => (
              <li key={item}>
                <Link href="/shop" className="text-[#a08868] hover:text-[#c9a14a] transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="text-[#f5e6cf] font-bold text-sm mb-5 uppercase tracking-[0.2em]">Support</h3>
          <ul className="space-y-3 text-sm">
            {[
              ['Track My Order', '/user/dashboard'],
              ['About Aurakriti', '/about'],
              ['Contact Us', '/contact'],
              ['Shipping Policy', '/'],
              ['Returns & Exchanges', '/'],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-[#a08868] hover:text-[#c9a14a] transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-[#f5e6cf] font-bold text-sm mb-5 uppercase tracking-[0.2em]">Visit Us</h3>
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <svg className="text-[#c9a14a] mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span className="text-[#a08868]">Jewellery Lane, Luxury Block,<br />Mumbai, India 400001</span>
            </li>
            <li className="flex items-center gap-3">
              <svg className="text-[#c9a14a] shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.13 15.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.06 5H6a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 12.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21 20v3"/></svg>
              <a href="tel:+919876543210" className="text-[#a08868] hover:text-[#c9a14a] transition-colors">+91 98765 43210</a>
            </li>
            <li className="flex items-center gap-3">
              <svg className="text-[#c9a14a] shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <a href="mailto:hello@aurakriti.com" className="text-[#a08868] hover:text-[#c9a14a] transition-colors">hello@aurakriti.com</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-6 mt-14 pt-8 border-t border-[#4a3525] flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-[#7a5c3e] uppercase tracking-widest">© 2026 Aurakriti. All Rights Reserved.</p>
        <div className="flex gap-8 text-xs text-[#7a5c3e] uppercase tracking-widest">
          <a href="#" className="hover:text-[#c9a14a] transition-colors">Privacy</a>
          <a href="#" className="hover:text-[#c9a14a] transition-colors">Terms</a>
          <a href="#" className="hover:text-[#c9a14a] transition-colors">Cookies</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
