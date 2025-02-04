"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatRupiah } from "@/lib/formatIdr";
import { getRevenue } from "@/server/actions";

interface RevenueStats {
  today: number;
  todayChange: number;
  thisWeek: number;
  thisWeekChange: number;
  thisMonth: number;
  thisMonthChange: number;
  thisYear: number;
  thisYearChange: number;
}

const Revenue = () => {
  // State untuk periode revenue yang dipilih
  const [revenueTimePeriod, setRevenueTimePeriod] = useState<"today" | "thisWeek" | "thisMonth" | "thisYear">("today");

  // State untuk data revenue yang didapat dari server action
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    today: 0,
    todayChange: 0,
    thisWeek: 0,
    thisWeekChange: 0,
    thisMonth: 0,
    thisMonthChange: 0,
    thisYear: 0,
    thisYearChange: 0,
  });

  // Mengambil data revenue dari server setiap kali periode berubah
  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        const data = await getRevenue();
        setRevenueStats(data);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
      }
    };

    fetchRevenueData();
  }, [revenueTimePeriod]);

  // Fungsi untuk mendapatkan revenue sesuai periode yang dipilih
  const getDisplayedRevenue = (): number => {
    switch (revenueTimePeriod) {
      case "today":
        return revenueStats.today;
      case "thisWeek":
        return revenueStats.thisWeek;
      case "thisMonth":
        return revenueStats.thisMonth;
      case "thisYear":
        return revenueStats.thisYear;
      default:
        return 0;
    }
  };

  // Fungsi untuk mendapatkan persentase perubahan sesuai periode yang dipilih
  const getChangePercentage = (): number => {
    switch (revenueTimePeriod) {
      case "today":
        return revenueStats.todayChange;
      case "thisWeek":
        return revenueStats.thisWeekChange;
      case "thisMonth":
        return revenueStats.thisMonthChange;
      case "thisYear":
        return revenueStats.thisYearChange;
      default:
        return 0;
    }
  };

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Revenue</h2>
        <select
          value={revenueTimePeriod}
          onChange={(e) => setRevenueTimePeriod(e.target.value as "today" | "thisWeek" | "thisMonth" | "thisYear")}
          className="border-2 border-black px-2 py-1"
        >
          <option value="today">Today</option>
          <option value="thisWeek">This Week</option>
          <option value="thisMonth">This Month</option>
          <option value="thisYear">This Year</option>
        </select>
      </div>
      <p className="text-3xl font-black">{formatRupiah(getDisplayedRevenue())}</p>
      <div className={`flex items-center mt-2 ${getChangePercentage() >= 0 ? "text-green-500" : "text-red-500"}`}>
        {getChangePercentage() >= 0 ? <ArrowUp size={20} /> : <ArrowDown size={20} />}
        <span className="font-bold">
          {Math.abs(getChangePercentage()).toFixed(2)}% vs previous period
        </span>
      </div>
    </div>
  );
};

export default Revenue;
