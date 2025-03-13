import { getPeakHours } from "@/server/actions";
import { Clock } from "lucide-react";
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";

// Interface untuk data jam puncak
interface PeakHourData {
  hour: string;
  customers: number;
}

const PeakHoursAnalysis = () => {
  // Menggunakan React Query untuk fetching data
  const { 
    data: peakHoursData = [], 
    isLoading: isLoadingPeakHours, 
    error 
  } = useQuery<PeakHourData[]>({
    // Kunci query unik
    queryKey: ['peakHoursData'],
    
    // Fungsi untuk mengambil data jam puncak
    queryFn: getPeakHours,
    
    // Refresh data setiap 3 menit
    refetchInterval: 3000,
    
    // Pertahankan data sebelumnya selama loading
    placeholderData: (previousData) => previousData,
  });

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Peak Time Analysis</h2>
        <Clock size={24} className="text-blue-500" />
      </div>
      <div className="h-[300px]">
        {isLoadingPeakHours ? (
          <div className="h-full flex items-center justify-center">
            <p>Loading peak hours data...</p>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center text-red-500">
            <p>Error loading peak hours data</p>
          </div>
        ) : peakHoursData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p>No peak hours data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={peakHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "2px solid black",
                  borderRadius: "0px",
                  padding: "10px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="customers" 
                stroke="#8884d8" 
                strokeWidth={2} 
                name="Number of Transactions" 
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PeakHoursAnalysis;