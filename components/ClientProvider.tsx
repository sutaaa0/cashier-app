"use client"
import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const ClientProvider = ({
    children,
  }: {
    children: React.ReactNode;
  }) => {

    const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            // Optional global configuration
            staleTime: 3000, // 5 seconds
            gcTime: 1000 * 60 * 60, // 1 hour
          },
        },
      });
      

    return (
        <QueryClientProvider client={queryClient}>
         {children}
        </QueryClientProvider>
      );
}

export default ClientProvider