"use client"

import { formatRupiah } from "@/lib/formatIdr"

interface RefundSummaryProps {
  totalReturn: number
  totalReplacement: number
  additionalPayment: number
  setAdditionalPayment: (amount: number) => void
  diskonPoin?: number
}

export function RefundSummary({
  totalReturn,
  totalReplacement,
  additionalPayment,
  setAdditionalPayment,
  diskonPoin = 0,
}: RefundSummaryProps) {
  const difference = totalReplacement - totalReturn;
  const isRefund = difference < 0;
  
  return (
    <div className="text-text border-2 border-border dark:border-darkBorder shadow-light dark:shadow-dark hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none dark:hover:shadow-none transition-all p-3 mt-8">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Ringkasan Pengembalian</h2>
      <div className="space-y-2">
        <p className="flex justify-between">
          <span className="font-bold">Total Pengembalian:</span>
          <span>{formatRupiah(totalReturn)}</span>
        </p>
        
        {diskonPoin > 0 && (
          <p className="flex justify-between text-blue-600">
            <span className="font-bold">Termasuk Diskon Poin:</span>
            <span>{formatRupiah(diskonPoin)}</span>
          </p>
        )}
        
        <p className="flex justify-between">
          <span className="font-bold">Total Penggantian:</span>
          <span>{formatRupiah(totalReplacement)}</span>
        </p>
        
        <p className="flex justify-between font-bold">
          <span>{isRefund ? "Kembali ke Pelanggan:" : "Selisih:"}</span>
          <span className={isRefund ? "text-green-600" : "text-red-600"}>
            {isRefund ? formatRupiah(Math.abs(difference)) : formatRupiah(difference)}
          </span>
        </p>
        
        {!isRefund && difference > 0 && (
          <div className="border-t-2 border-black pt-2 mt-2">
            <label htmlFor="additionalPayment" className="block font-bold mb-1">
              Pembayaran Tambahan:
            </label>
            <input
              id="additionalPayment"
              type="number"
              value={additionalPayment}
              onChange={(e) => setAdditionalPayment(Number(e.target.value))}
              className="w-full px-2 py-1 border-2 border-black"
              min={0}
            />
            
            {additionalPayment < difference && (
              <p className="text-red-500 text-sm mt-1">
                Pembayaran tambahan kurang dari selisih harga
              </p>
            )}
            
            {additionalPayment >= difference && (
              <p className="text-green-600 text-sm mt-1">
                Kembalian: {formatRupiah(additionalPayment - difference)}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}