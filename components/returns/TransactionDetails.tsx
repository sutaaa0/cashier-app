"use client"

import { formatRupiah } from "@/lib/formatIdr"

interface TransactionDetails {
  tanggalPenjualan: string
  total_harga: number
  uangMasuk: number
  kembalian: number
}

interface TransactionDetailsProps {
  penjualanId: string
  setPenjualanId: (id: string) => void
  fetchTransactionDetails: (id: string) => void
  transactionDetails: TransactionDetails | null
}

export function TransactionDetails({
  penjualanId,
  setPenjualanId,
  fetchTransactionDetails,
  transactionDetails,
}: TransactionDetailsProps) {
  return (
    <div className="border-4 border-black p-4 bg-white">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Detail Transaksi</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={penjualanId}
          onChange={(e) => setPenjualanId(e.target.value)}
          placeholder="Masukkan ID transaksi"
          className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
        />
        <button
          onClick={() => fetchTransactionDetails(penjualanId)}
          className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
        >
          Cari
        </button>
      </div>
      {transactionDetails && (
        <div className="mt-4 p-4 border-2 border-black">
          <p>
            <strong>Tanggal:</strong> {new Date(transactionDetails.tanggalPenjualan).toLocaleString()}
          </p>
          <p>
            <strong>Total:</strong> {formatRupiah(transactionDetails.total_harga)}
          </p>
          <p>
            <strong>Uang Masuk:</strong> {formatRupiah(transactionDetails.uangMasuk || 0)}
          </p>
          <p>
            <strong>Kembalian:</strong> {formatRupiah(transactionDetails.kembalian || 0)}
          </p>
        </div>
      )}
    </div>
  )
}

