// RefundReceiptModal.tsx (continued)
import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount)
}

interface RefundReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    transactionDetails: any
    returnedItems: {
      produkId: number
      nama: string
      kuantitas: number
      harga: number
    }[]
    replacementItems: {
      produkId: number
      nama: string
      kuantitas: number
      harga: number
    }[]
    totalReturn: number
    totalReplacement: number
    additionalPayment: number
  } | null
}

export function RefundReceiptModal({ isOpen, onClose, data }: RefundReceiptModalProps) {
  if (!data?.transactionDetails) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[500px] font-mono bg-white">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Nota Pengembalian
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 space-y-4">
          {/* Header Info */}
          <div className="text-center border-b-2 border-black pb-2">
            <h2 className="font-bold text-lg">TOKO BERKAH</h2>
            <p className="text-sm">Jl. Contoh No. 123, Kota</p>
            <p className="text-sm">Telp: (021) 123-4567</p>
          </div>

          {/* Transaction Details */}
          <div className="space-y-1 text-sm">
            <p>No. Transaksi: {data.transactionDetails.penjualanId}</p>
            <p>Tanggal: {format(new Date(data.transactionDetails.tanggalPenjualan), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
            <p>Kasir: {data.transactionDetails.user?.username || 'Admin'}</p>
          </div>

          {/* Returned Items */}
          <div className="space-y-2">
            <h3 className="font-bold border-b border-black">Barang yang Dikembalikan:</h3>
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Harga</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.returnedItems.filter(item => item.kuantitas > 0).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.nama}</td>
                    <td className="text-right">{item.kuantitas}</td>
                    <td className="text-right">{formatRupiah(item.harga)}</td>
                    <td className="text-right">{formatRupiah(item.harga * item.kuantitas)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-right font-bold">
              Total Pengembalian: {formatRupiah(data.totalReturn)}
            </p>
          </div>

          {/* Replacement Items */}
          {data.replacementItems.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold border-b border-black">Barang Pengganti:</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Harga</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.replacementItems.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.nama}</td>
                      <td className="text-right">{item.kuantitas}</td>
                      <td className="text-right">{formatRupiah(item.harga)}</td>
                      <td className="text-right">{formatRupiah(item.harga * item.kuantitas)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-right font-bold">
                Total Penggantian: {formatRupiah(data.totalReplacement)}
              </p>
            </div>
          )}

          {/* Payment Summary */}
          <div className="border-t-2 border-black pt-2 space-y-1">
            <div className="flex justify-between">
              <span>Total Pengembalian:</span>
              <span>{formatRupiah(data.totalReturn)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total Penggantian:</span>
              <span>{formatRupiah(data.totalReplacement)}</span>
            </div>
            {data.additionalPayment > 0 && (
              <div className="flex justify-between font-bold">
                <span>Pembayaran Tambahan:</span>
                <span>{formatRupiah(data.additionalPayment)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center text-sm pt-4 space-y-2">
            <p>Barang yang sudah dibeli/ditukar</p>
            <p>tidak dapat dikembalikan</p>
            <p className="font-bold">Terima Kasih</p>
            <p>Atas kunjungan anda</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}