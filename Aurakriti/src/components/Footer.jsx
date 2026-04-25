import Link from "next/link";

const FOOTER_LINKS = {
  Shop: [
    { label: "All Products",  href: "/products" },
    { label: "Deals & Offers", href: "/deals" },
    { label: "New Arrivals",  href: "/products?sort=newest" },
    { label: "Brands",        href: "/brands" },
  ],
  Account: [
    { label: "My Profile",   href: "/user/profile" },
    { label: "My Orders",    href: "/user/orders" },
    { label: "Wishlist",     href: "/user/wishlist" },
    { label: "Notifications", href: "/user/notifications" },
  ],
  Seller: [
    { label: "Seller Dashboard", href: "/seller" },
    { label: "Add Product",      href: "/seller/products/new" },
    { label: "Manage Orders",    href: "/seller/orders" },
  ],
  Support: [
    { label: "Help Centre", href: "/help" },
    { label: "Contact Us",  href: "/contact" },
    { label: "Returns",     href: "/returns" },
    { label: "Shipping",    href: "/shipping" },
  ],
};

const PAYMENT_ICONS = ["💳", "🏦", "📱", "💰"];

export default function Footer() {
  return (
    <footer style={{ background: "var(--gray-900)", color: "var(--gray-400)" }}>

      {/* Trust bar */}
      <div
        style={{
          borderBottom: "1px solid var(--gray-700)",
          padding: "1.25rem 0",
        }}
      >
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              { icon: "🚚", title: "Free Delivery",   sub: "On orders over ₹499" },
              { icon: "↩️",  title: "Easy Returns",    sub: "10-day hassle-free" },
              { icon: "🔒", title: "Secure Payments", sub: "256-bit encryption" },
              { icon: "🎧", title: "24/7 Support",    sub: "Always here to help" },
            ].map(({ icon, title, sub }) => (
              <div key={title} className="flex flex-col items-center gap-1">
                <span style={{ fontSize: "1.5rem" }}>{icon}</span>
                <p style={{ color: "#F1F5F9", fontSize: "0.8125rem", fontWeight: 600 }}>{title}</p>
                <p style={{ fontSize: "0.75rem" }}>{sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main footer content */}
      <div className="section-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" style={{ textDecoration: "none" }}>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "#F1F5F9",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.03em",
                }}
              >
                Aura<span style={{ color: "var(--brand-400)" }}>kriti</span>
              </span>
            </Link>
            <p style={{ fontSize: "0.8125rem", lineHeight: 1.7, marginTop: "0.75rem" }}>
              Your one-stop destination for everything you love. Quality products, trusted brands.
            </p>

            {/* Social links */}
            <div className="flex gap-3 mt-4">
              {[
                { label: "Instagram", icon: "📸", href: "#" },
                { label: "Twitter",   icon: "🐦", href: "#" },
                { label: "Facebook",  icon: "👤", href: "#" },
              ].map(({ label, icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: 34, height: 34,
                    background: "var(--gray-800)",
                    borderRadius: "var(--radius-md)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem",
                    textDecoration: "none",
                  }}
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4
                style={{
                  color: "#F1F5F9",
                  fontSize: "0.8125rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {group}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      style={{
                        fontSize: "0.8125rem",
                        color: "var(--gray-400)",
                        textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => (e.target.style.color = "#F1F5F9")}
                      onMouseLeave={(e) => (e.target.style.color = "var(--gray-400)")}
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

      {/* Bottom bar */}
      <div
        style={{ borderTop: "1px solid var(--gray-800)", padding: "1rem 0" }}
      >
        <div className="section-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <p style={{ fontSize: "0.75rem" }}>
            © {new Date().getFullYear()} Aurakriti. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            {PAYMENT_ICONS.map((icon, i) => (
              <span
                key={i}
                style={{
                  fontSize: "1.25rem",
                  background: "var(--gray-800)",
                  width: 36, height: 24,
                  borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {icon}
              </span>
            ))}
          </div>

          <div className="flex gap-4">
            {["Privacy Policy", "Terms of Service", "Cookies"].map((item) => (
              <Link
                key={item}
                href="#"
                style={{ fontSize: "0.75rem", color: "var(--gray-500)", textDecoration: "none" }}
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
