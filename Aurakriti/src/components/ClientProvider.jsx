"use client";

import { Provider } from "react-redux";
import { store } from "../redux/store";
import Navbar from "./ecommerce/Navbar";
import Footer from "./ecommerce/Footer";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

export default function ClientProvider({ children }) {
  return (
    <Provider store={store}>
      {/* App Background */}
      <div
        className="
          min-h-screen
          bg-gradient-to-br
          from-[#fffdf8]
          via-[#fffaf3]
          to-[#f9f4ec]
          text-[#2f241c]
          flex flex-col
        "
      >
        {/* Decorative Background Blurs */}
        <div
          className="
            fixed top-0 left-0
            h-[320px] w-[320px]
            rounded-full
            bg-[#ffe8b6]
            opacity-30 blur-3xl
            pointer-events-none
            -z-10
          "
        />

        <div
          className="
            fixed bottom-0 right-0
            h-[280px] w-[280px]
            rounded-full
            bg-[#f5d8a7]
            opacity-20 blur-3xl
            pointer-events-none
            -z-10
          "
        />

        {/* Navbar */}
        <header
          className="
            sticky top-0 z-50
            backdrop-blur-xl
            bg-white/75
            border-b border-[#f2e8da]
            shadow-sm
          "
        >
          <Navbar />
        </header>

        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.main
            key="page-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35 }}
            className="flex-1"
          >
            {children}
          </motion.main>
        </AnimatePresence>

        {/* Footer */}
        <Footer />

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: "18px",
              padding: "14px 18px",
              fontWeight: 600,
            },
          }}
        />
      </div>
    </Provider>
  );
}