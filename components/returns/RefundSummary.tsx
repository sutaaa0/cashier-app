"use client"

import { formatRupiah } from "@/lib/formatIdr"

interface RefundSummaryProps {
  totalReturn: number
  totalReplacement: number
  additionalPayment: number
  setAdditionalPayment: (amount: number) => void
}

export function RefundSummary({
  totalReturn,
  totalReplacement,
  additionalPayment,
  setAdditionalPayment,
}: RefundSummaryProps) {
  return (
    <div className="border-4 border-black p-4 bg-white mt-8">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Ringkasan Pengembalian</h2>
      <div className="space-y-2">
        <p className="flex justify-between">
          <span className="font-bold">Total Pengembalian:</span>
          <span>{formatRupiah(totalReturn)}</span>
        </p>
        <p className="flex justify-between">
          <span className="font-bold">Total Penggantian:</span>
          <span>{formatRupiah(totalReplacement)}</span>
        </p>
        <p className="flex justify-between">
          <span className="font-bold">Selisih:</span>
          <span>{formatRupiah(totalReplacement - totalReturn)}</span>
        </p>
        {totalReplacement > totalReturn && (
          <div>
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
          </div>
        )}
      </div>
    </div>
  )
}

