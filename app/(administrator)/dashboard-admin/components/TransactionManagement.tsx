"use client"

import { useState } from 'react'
import { FileText, Eye, Download, Calendar, DollarSign } from 'lucide-react'

interface TransactionData {
  id: number
  date: string
  customer: string
  items: number
  total: number
  status: 'completed' | 'pending' | 'cancelled'
}

const mockTransactions: TransactionData[] = [
  { id: 1, date: '2023-06-01', customer: 'Alice Johnson', items: 3, total: 25.50, status: 'completed' },
  { id: 2, date: '2023-06-02', customer: 'Bob Williams', items: 2, total: 34.75, status: 'pending' },
  { id: 3, date: '2023-06-03', customer: 'Charlie Brown', items: 4, total: 18.90, status: 'completed' },
]

export function TransactionManagement() {
  const [transactions, setTransactions] = useState<TransactionData[]>(mockTransactions)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">TRANSACTION HISTORY</h2>
        <button className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
          <Download size={20} />
          Export Data
        </button>
      </div>
      <div className="grid gap-4">
        {transactions.map(transaction => (
          <div key={transaction.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#93B8F3] border-[3px] border-black">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Transaction #{transaction.id}</h3>
                    <span className={`px-2 py-1 text-white text-sm font-bold ${getStatusColor(transaction.status)}`}>
                      {transaction.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center text-sm">
                      <Calendar size={16} className="mr-1" />
                      {transaction.date}
                    </span>
                    <span className="flex items-center text-sm font-bold">
                      <DollarSign size={16} className="mr-1" />
                      {transaction.total.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{transaction.customer} • {transaction.items} items</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                  <Eye size={20} />
                </button>
                <button className="p-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                  <Download size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

