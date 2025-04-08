// File: components/TopCustomers.tsx
import { formatRupiah } from "@/lib/formatIdr";
import { getTopCustomers } from "@/server/actions";
import { Star, Calendar, ShoppingBag } from "lucide-react";
import React, { useEffect, useState } from "react";

interface TopCustomer {
  id: number;
  nama: string;
  totalSpent: number;
  points: number;
  transactionCount: number;
  lastPurchaseDate: string;
}

const TopCustomers = () => {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "month" | "year">("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getTopCustomers(period);
        if (Array.isArray(data)) {
          setCustomers(data);
        } else {
          console.error('Data yang diterima bukan array:', data);
          setCustomers([]);
        }
      } catch (error) {
        console.error("Error:", error);
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [period]);

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center">Memuat data pelanggan teratas...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Member Teratas</h2>
        <Star size={24} className="text-yellow-500" />
      </div>
      
      {/* Period selector */}
      <div className="flex mb-4 space-x-2">
        <button
          onClick={() => setPeriod("all")}
          className={`px-3 py-1 text-sm border-2 border-black ${period === "all" ? "bg-blue-400" : "bg-white"}`}
        >
          Sepanjang Masa
        </button>
        <button
          onClick={() => setPeriod("month")}
          className={`px-3 py-1 text-sm border-2 border-black ${period === "month" ? "bg-blue-400" : "bg-white"}`}
        >
          Bulan Ini
        </button>
        <button
          onClick={() => setPeriod("year")}
          className={`px-3 py-1 text-sm border-2 border-black ${period === "year" ? "bg-blue-400" : "bg-white"}`}
        >
          Tahun Ini
        </button>
      </div>
      
      <div className="space-y-4">
        {customers.length === 0 ? (
          <div className="p-3 border-2 border-black">
            <p className="text-center">Belum ada member dengan transaksi pada periode ini</p>
          </div>
        ) : (
          customers.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 border-2 border-black">
              <div className="space-y-1">
                <p className="font-bold">{customer.nama}</p>
                <div className="flex items-center text-sm">
                  <ShoppingBag size={14} className="mr-1" />
                  <span>{formatRupiah(customer.totalSpent)}</span>
                  <span className="ml-2 text-gray-600">({customer.transactionCount} transaksi)</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar size={14} className="mr-1" />
                  <span>Terakhir: {customer.lastPurchaseDate}</span>
                </div>
                <p className="text-sm">Poin: {customer.points}</p>
              </div>
              <div
                className={`px-2 py-1 font-bold border-2 border-black transform ${
                  index === 0 ? 'bg-yellow-400 rotate-3' :
                  index === 1 ? 'bg-gray-200 -rotate-2' :
                  'bg-gray-100 rotate-1'
                }`}
              >
                #{index + 1}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TopCustomers;