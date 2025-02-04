import { getPeakHours } from "@/server/actions";
import { Clock } from "lucide-react";
import React, { useEffect, useState } from "react";
import { CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, LineChart, Line } from "recharts";

const PeakHoursAnalysis = () => {
  const [peakHoursData, setPeakHoursData] = useState<Array<{ hour: string; customers: number }>>([]);
  const [isLoadingPeakHours, setIsLoadingPeakHours] = useState(false);

  useEffect(() => {
    const fetchPeakHours = async () => {
      try {
        setIsLoadingPeakHours(true);
        const data = await getPeakHours();
        setPeakHoursData(data);
        console.log("ini data perjam", peakHoursData);
      } catch (error) {
        console.error("Error fetching peak hours:", error);
        setPeakHoursData([]); // Set empty array on error
      } finally {
        setIsLoadingPeakHours(false);
      }
    };

    fetchPeakHours();
  }, []); 

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Analisis Waktu Puncak</h2>
        <Clock size={24} className="text-blue-500" />
      </div>
      <div className="h-[300px]">
        {isLoadingPeakHours ? (
          <div className="h-full flex items-center justify-center">
            <p>Loading peak hours data...</p>
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
              <Line type="monotone" dataKey="customers" stroke="#8884d8" strokeWidth={2} name="Number of Transactions" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default PeakHoursAnalysis;
