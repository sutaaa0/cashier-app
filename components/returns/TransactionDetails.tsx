"use client"

import { formatRupiah } from "@/lib/formatIdr"
import { Button } from "../ui/button"

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
    <div className="text-text border-2 border-border dark:border-darkBorder shadow-light dark:shadow-dark hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none dark:hover:shadow-none transition-all p-3">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Detail Transaksi</h2>
      <div className="flex gap-2 mb-4">
        <input
          value={penjualanId}
          onChange={(e) => setPenjualanId(e.target.value)}
          placeholder="Masukkan ID transaksi"
          className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
        />
        <Button
          onClick={() => fetchTransactionDetails(penjualanId)}
          className="px-4 py-2 bg-[#FFD700] text-black font-bold"
        >
          Cari
        </Button>
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

