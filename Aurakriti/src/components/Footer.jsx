import Link from "next/link";

const FOOTER_LINKS = {
  Shop: [
    { label: "All Products", href: "/products" },
    { label: "Deals & Offers", href: "/deals" },
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Brands", href: "/brands" },
  ],
  Account: [
    { label: "My Profile", href: "/user/profile" },
    { label: "My Orders", href: "/user/orders" },
    { label: "Wishlist", href: "/user/wishlist" },
    { label: "Notifications", href: "/user/notifications" },
  ],
  Seller: [
    { label: "Seller Dashboard", href: "/seller" },
    { label: "Add Product", href: "/seller/products/new" },
    { label: "Manage Orders", href: "/seller/orders" },
  ],
  Support: [
    { label: "Help Centre", href: "/help" },
    { label: "Contact Us", href: "/contact" },
    { label: "Returns", href: "/returns" },
    { label: "Shipping", href: "/shipping" },
  ],
};

const TRUST_ITEMS = [
  { icon: "🚚", title: "Free Delivery", sub: "On orders over ₹499" },
  { icon: "↩️", title: "Easy Returns", sub: "10-day hassle-free" },
  { icon: "🔒", title: "Secure Payments", sub: "256-bit encryption" },
  { icon: "🎧", title: "24/7 Support", sub: "Always here to help" },
];

const SOCIALS = [
  { label: "Instagram", icon: "📸", href: "#" },
  { label: "Twitter", icon: "🐦", href: "#" },
  { label: "Facebook", icon: "👤", href: "#" },
];

const PAYMENT_ICONS = ["💳", "🏦", "📱", "💰"];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-400">

      {/* Trust Bar */}
      <div className="border-b border-gray-700 py-5">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {TRUST_ITEMS.map(({ icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-1">
                <span className="text-xl">{icon}</span>
                <p className="text-slate-100 text-sm font-semibold">{title}</p>
                <p className="text-xs">{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="section-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-xl font-extrabold text-slate-100 tracking-tight">
              Aura<span className="text-brand-400">kriti</span>
            </Link>

            <p className="text-xs leading-relaxed mt-3">
              Your one-stop destination for everything you love. Quality products, trusted brands.
            </p>

            {/* Socials */}
            <div className="flex gap-3 mt-4">
              {SOCIALS.map(({ label, icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center bg-gray-800 rounded-md hover:bg-gray-700 transition"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-slate-100 text-xs font-bold uppercase tracking-wider mb-3">
                {group}
              </h4>

              <ul className="space-y-2">
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-xs text-slate-400 hover:text-slate-100 transition"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 py-4">
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-3">

          <p className="text-xs">
            © {year} Aurakriti. All rights reserved.
          </p>

          {/* Payment */}
          <div className="flex gap-2">
            {PAYMENT_ICONS.map((icon, i) => (
              <span
                key={i}
                className="w-9 h-6 flex items-center justify-center bg-gray-800 rounded text-sm"
              >
                {icon}
              </span>
            ))}
          </div>

          {/* Legal */}
          <div className="flex gap-4">
            {["Privacy Policy", "Terms", "Cookies"].map((item) => (
              <Link
                key={item}
                href="#"
                className="text-xs text-gray-500 hover:text-slate-200 transition"
              >
                {item}
              </Link>
            ))}
          </div>

        </div>
      </div>
    </footer>
  );
}