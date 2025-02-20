import { formatRupiah } from "@/lib/formatIdr"

interface TotalSummaryProps {
  totalReturn: number
  totalReplacement: number
  additionalPayment: number
  onAdditionalPaymentChange: (value: number) => void
}

export function TotalSummary({
  totalReturn,
  totalReplacement,
  additionalPayment,
  onAdditionalPaymentChange,
}: TotalSummaryProps) {
  return (
    <div className="mb-4 space-y-2">
      <p>
        <strong>Total Pengembalian:</strong> {formatRupiah(totalReturn)}
      </p>
      <p>
        <strong>Total Penggantian:</strong> {formatRupiah(totalReplacement)}
      </p>
      <p>
        <strong>Selisih:</strong> {formatRupiah(totalReplacement - totalReturn)}
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
            onChange={(e) => onAdditionalPaymentChange(Number(e.target.value))}
            className="w-full px-2 py-1 border-2 border-black"
            min={0}
          />
        </div>
      )}
    </div>
  )
}

