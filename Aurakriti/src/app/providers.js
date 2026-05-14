// src/app/providers.js

"use client";

import ReduxProvider from "@/components/ReduxProvider";
import { Toaster } from "sonner";

export function Providers({ children }) {
  return (
    <ReduxProvider>
      {children}
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
    </ReduxProvider>
  );
}
