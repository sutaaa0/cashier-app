"use client";

import { useQuery } from "@tanstack/react-query";
import { getNewCustomersStats } from "@/server/actions";
import { ArrowDown, ArrowUp, Users } from "lucide-react";
import React from "react";

// Interface untuk tipe data statistik pelanggan baru
interface CustomerStats {
  today: number;
  difference: number;
  yesterday: number;
}

const Member = () => {
  // Menggunakan React Query untuk fetching data dengan caching otomatis
  const { data: customerStats = { 
    today: 0, 
    difference: 0, 
    yesterday: 0 
  } } = useQuery<CustomerStats, Error, CustomerStats>({
    queryKey: ['customerStats'],
    queryFn: getNewCustomersStats,
    // Refresh data setiap 30 detik
    refetchInterval: 30000,
    // Pertahankan data terakhir selama loading
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">New Member</h2>
        <Users size={24} className="text-purple-500" />
      </div>
      <p className="text-3xl font-black">{customerStats.today}</p>
      <div className={`flex items-center mt-2 ${customerStats.difference >= 0 ? "text-green-500" : "text-red-500"}`}>
        {customerStats.difference >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
        <span className="font-bold">
          {Math.abs(customerStats.difference)} {customerStats.difference >= 0 ? "more" : "less"} than yesterday
        </span>
      </div>
    </div>
  );
};

export default Member;

// Catatan Implementasi:
// 1. Instal @tanstack/react-query terlebih dahulu
// 2. Bungkus komponen induk dengan QueryClientProvider
// 3. Fungsi server action (getNewCustomersStats) harus mengembalikan objek CustomerStats lengkap
// 4. Konfigurasi refetchInterval untuk refresh berkala
// 5. keepPreviousData mencegah flicker saat memuat ulang data