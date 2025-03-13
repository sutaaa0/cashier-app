"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { getRecentTransactions } from "@/server/actions"
import { formatRupiah } from "@/lib/formatIdr"

interface Transaction {
  penjualanId: number
  tanggalPenjualan: Date
  total_harga: number
}

interface RecentTransactionsProps {
  onSelectTransaction: (id: number) => void
}

export function RecentTransactions({ onSelectTransaction }: RecentTransactionsProps) {
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      try {
        const transactions = await getRecentTransactions()
        setRecentTransactions(transactions)
      } catch (error) {
        console.error("Error fetching recent transactions:", error)
      }
    }

    fetchRecentTransactions()
  }, [])

  return (
    <div className="text-text border-2 border-border dark:border-darkBorder shadow-light dark:shadow-dark hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none dark:hover:shadow-none transition-all p-3">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Recent Transactions</h2>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentTransactions.map((transaction) => (
          <button
            key={transaction.penjualanId}
            onClick={() => onSelectTransaction(transaction.penjualanId)}
            className="w-full p-3 border-2 border-black hover:bg-[#FFD700] transition-colors text-left flex justify-between items-center transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
          >
            <div>
              <div className="font-bold">ID: {transaction.penjualanId}</div>
              <div className="text-sm">{new Date(transaction.tanggalPenjualan).toLocaleString()}</div>
            </div>
            <div>
              <div className="font-bold text-right">{formatRupiah(transaction.total_harga)}</div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="w-4 h-4 mr-1" />
                {new Date(transaction.tanggalPenjualan).toLocaleDateString()}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

