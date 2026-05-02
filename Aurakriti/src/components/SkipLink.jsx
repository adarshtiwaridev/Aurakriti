// src/components/SkipLink.jsx

"use client";

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: "absolute",
        left: "-9999px",
        top: "auto",
        width: 1,
        height: 1,
        overflow: "hidden",
      }}
      onFocus={(e) => {
        e.target.style.left = "1rem";
        e.target.style.top = "1rem";
        e.target.style.width = "auto";
        e.target.style.height = "auto";
        e.target.style.zIndex = 9999;
        e.target.style.background = "var(--brand-500)";
        e.target.style.color = "#fff";
        e.target.style.padding = "0.5rem 1rem";
        e.target.style.borderRadius = "var(--radius-md)";
      }}
      onBlur={(e) => {
        e.target.style.left = "-9999px";
      }}
    >
      Skip to main content
    </a>
  );
}