import React from "react"
import { X, Calendar, DollarSign, User, ShoppingBag } from "lucide-react"

interface ViewTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: TransactionData
}

export function ViewTransactionModal({ isOpen, onClose, transaction }: ViewTransactionModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Transaction Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} />
            <span>Date: {new Date(transaction.tanggalPenjualan).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={20} />
            <span>Total: ${transaction.total_harga.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <User size={20} />
            <span>
              Customer: {transaction.pelanggan ? transaction.pelanggan.nama : `Guest ${transaction.guest?.guestId}`}
            </span>
          </div>
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <ShoppingBag size={20} />
              Items:
            </h3>
            <ul className="list-disc list-inside">
              {transaction.detailPenjualan.map((detail, index) => (
                <li key={index}>{detail.produk.nama}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

