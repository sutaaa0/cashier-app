"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

const defaultRevenueStats: RevenueStats = {
  today: 0,
  todayChange: 0,
  thisWeek: 0,
  thisWeekChange: 0,
  thisMonth: 0,
  thisMonthChange: 0,
  thisYear: 0,
  thisYearChange: 0,
};

const Revenue = () => {
  // State untuk periode revenue yang dipilih
  const [revenueTimePeriod, setRevenueTimePeriod] = useState<
    "today" | "thisWeek" | "thisMonth" | "thisYear"
  >("today");

  // Mengambil data revenue menggunakan React Query
  const { data: revenueStats = defaultRevenueStats } = useQuery<RevenueStats>({
    queryKey: ["revenue"],
    queryFn: getRevenue,
    refetchInterval: 30000, // 30 detik
  });

  // Variabel untuk revenue dan perubahan persentase
  const displayedRevenue =
    revenueTimePeriod === "today"
      ? revenueStats.today
      : revenueTimePeriod === "thisWeek"
      ? revenueStats.thisWeek
      : revenueTimePeriod === "thisMonth"
      ? revenueStats.thisMonth
      : revenueStats.thisYear;

  const changePercentage =
    revenueTimePeriod === "today"
      ? revenueStats.todayChange
      : revenueTimePeriod === "thisWeek"
      ? revenueStats.thisWeekChange
      : revenueTimePeriod === "thisMonth"
      ? revenueStats.thisMonthChange
      : revenueStats.thisYearChange;

  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Pendapatan</h2>
        <select
          value={revenueTimePeriod}
          onChange={(e) =>
            setRevenueTimePeriod(
              e.target.value as "today" | "thisWeek" | "thisMonth" | "thisYear"
            )
          }
          className="border-2 border-black px-2 py-1"
        >
          <option value="today">Hari ini</option>
          <option value="thisWeek">Minggu ini</option>
          <option value="thisMonth">Bulan ini</option>
          <option value="thisYear">Tahun ini</option>
        </select>
      </div>

      <p className="text-3xl font-black">{formatRupiah(displayedRevenue)}</p>

      <div className="flex items-center mt-2">
        {changePercentage > 0 ? (
          <span className="text-green-500 flex items-center">
            <ArrowUp size={20} />
            <span className="font-bold">
              {changePercentage.toFixed(2)}% vs periode sebelumnya
            </span>
          </span>
        ) : changePercentage < 0 ? (
          <span className="text-red-500 flex items-center">
            <ArrowDown size={20} />
            <span className="font-bold">
              {Math.abs(changePercentage).toFixed(2)}% vs periode sebelumnya
            </span>
          </span>
        ) : (
          <span className="text-gray-500 font-bold">Tidak ada perubahan</span>
        )}
      </div>
    </div>
  );
};

export default Revenue;
