// src/app/providers.js

"use client";

import ReduxProvider from "@/components/ReduxProvider";

export function Providers({ children }) {
  return <ReduxProvider>{children}</ReduxProvider>;
}
