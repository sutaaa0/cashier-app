"use client";
import { getTransactionsStats } from "@/server/actions";
import { ArrowDown, ArrowUp, ShoppingCart } from "lucide-react";
import React, { useEffect, useState } from "react";

const Transactions = () => {
  const [transactionStats, setTransactionStats] = useState({ today: 0, difference: 0, yesterday: 0 });

  useEffect(() => {
    const fetchTransactionStats = async () => {
      try {
        const data = await getTransactionsStats();
        setTransactionStats(data);
      } catch (error) {
        console.error("Error fetching transaction data:", error);
      }
    };

    fetchTransactionStats();
  }, []);

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
