import { formatRupiah } from "@/lib/formatIdr"
import { Clock } from "lucide-react"

interface Transaction {
  penjualanId: number
  tanggalPenjualan: Date
  total_harga: number
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  onTransactionClick: (id: number) => void
  isLoading: boolean
}

export function RecentTransactions({ transactions, onTransactionClick, isLoading }: RecentTransactionsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-2">Transaksi Terbaru</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {transactions.map((transaction) => (
          <button
            key={transaction.penjualanId}
            onClick={() => onTransactionClick(transaction.penjualanId)}
            disabled={isLoading}
            className="w-full p-3 border-2 border-black hover:bg-gray-100 transition-colors text-left flex justify-between items-center disabled:opacity-50 disabled:cursor-not-allowed"
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

