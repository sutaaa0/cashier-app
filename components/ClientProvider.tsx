"use client";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Optional global configuration
        staleTime: 5 * 60 * 1000, // 5 menit (data dianggap fresh selama 5 menit)
        gcTime: 60 * 60 * 1000, // 1 jam (data dihapus dari cache setelah 1 jam tidak digunakan)
      },
    },
  });

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default ClientProvider;
