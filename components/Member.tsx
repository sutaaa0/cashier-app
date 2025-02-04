"use client";
import { getNewCustomersStats } from "@/server/actions";
import { ArrowDown, ArrowUp, Users } from "lucide-react";
import React, { useEffect, useState } from "react";

const Member = () => {
  const [customerStats, setCustomerStats] = useState({ today: 0, difference: 0, yesterday: 0 });

  useEffect(() => {
    const fetchCustomerStats = async () => {
      try {
        const data = await getNewCustomersStats();
        setCustomerStats(data);
      } catch (error) {
        console.error("Error fetching customer data:", error);
      }
    };

    fetchCustomerStats();
  }, []);

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
