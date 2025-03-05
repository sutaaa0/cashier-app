"use client";

import { useQuery } from "@tanstack/react-query";
import { getTransactionsStats } from "@/server/actions";
import { ArrowDown, ArrowUp, ShoppingCart } from "lucide-react";
import React from "react";

// Interface untuk tipe data statistik transaksi
interface TransactionStats {
  today: number;
  difference: number;
  yesterday: number;
}

const Transactions = () => {
  // Menggunakan React Query untuk fetching data dengan caching otomatis
  const { data: transactionStats = { 
    today: 0, 
    difference: 0, 
    yesterday: 0 
  } } = useQuery<TransactionStats>({
    queryKey: ['transactionStats'],
    queryFn: getTransactionsStats,
    // Refresh data setiap 30 detik
    refetchInterval: 30000,
    // Pertahankan data terakhir selama loading
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
        <ShoppingCart size={24} className="text-blue-500" />
      </div>
      <p className="text-3xl font-black">{transactionStats.today}</p>
      <div className={`flex items-center mt-2 ${transactionStats.difference >= 0 ? "text-green-500" : "text-red-500"}`}>
        {transactionStats.difference >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
        <span className="font-bold">
          {Math.abs(transactionStats.difference)} {transactionStats.difference >= 0 ? "more" : "less"} than yesterday
        </span>
      </div>
    </div>
  );
};

export default Transactions;

// Catatan Implementasi:
// 1. Instal @tanstack/react-query terlebih dahulu
// 2. Bungkus komponen induk dengan QueryClientProvider
// 3. Fungsi server action (getTransactionsStats) harus mengembalikan objek TransactionStats lengkap
// 4. Konfigurasi refetchInterval untuk refresh berkala
// 5. keepPreviousData mencegah flicker saat memuat ulang data