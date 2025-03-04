"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a client with default settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute - data stays fresh for 1 minute
      refetchOnWindowFocus: true, // auto-refresh when the window regains focus
      refetchOnMount: true, // refetch when component mounts
      retry: 1, // retry failed queries once
      gcTime: 10 * 60 * 1000, // 10 minutes - how long to keep data in cache
    },
  },
});

export function PromotionDataProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}