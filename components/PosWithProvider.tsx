"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Pos from "./Pos";

// Wrap the Pos component with the QueryClientProvider
export default function PosWithProvider() {
    // Create a client
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 10000, // 10 seconds
          refetchOnWindowFocus: true,
          retry: 3,
        },
      },
    });

    return (
      <QueryClientProvider client={queryClient}>
        <Pos />
      </QueryClientProvider>
    );
  }