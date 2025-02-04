import { formatRupiah } from "@/lib/formatIdr";
import { getTopCustomers } from "@/server/actions";
import { Star } from "lucide-react";
import React, { useEffect, useState } from "react";

interface TopCustomer {
  id: number;
  nama: string;
  totalSpent: number;
  points: number;
}

const TopCustomers = () => {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await getTopCustomers();
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
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
        <p className="text-center">Memuat data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Pelanggan Teratas</h2>
        <Star size={24} className="text-yellow-500" />
      </div>
      <div className="space-y-4">
        {customers.length === 0 ? (
          <div className="p-3 border-2 border-black">
            <p className="text-center">Belum ada data pelanggan</p>
          </div>
        ) : (
          customers.map((customer, index) => (
            <div key={customer.id} className="flex items-center justify-between p-3 border-2 border-black">
              <div>
                <p className="font-bold">{customer.nama}</p>
                <p className="text-sm">Total belanja: {formatRupiah(customer.totalSpent)}</p>
                <p className="text-sm text-gray-600">Poin: {customer.points}</p>
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