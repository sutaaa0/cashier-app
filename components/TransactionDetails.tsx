import { formatRupiah } from "@/lib/formatIdr"

interface TransactionDetailsProps {
  details: {
    tanggalPenjualan: string
    total_harga: number
    uangMasuk: number
    kembalian: number
  }
}

export function TransactionDetails({ details }: TransactionDetailsProps) {
  return (
    <div className="mb-6 p-4 border-2 border-black">
      <h3 className="text-xl font-bold mb-2">Detail Transaksi</h3>
      <p>Tanggal: {new Date(details.tanggalPenjualan).toLocaleString()}</p>
      <p>Total: {formatRupiah(details.total_harga)}</p>
      <p>Uang Masuk: {formatRupiah(details.uangMasuk || 0)}</p>
      <p>Kembalian: {formatRupiah(details.kembalian || 0)}</p>
    </div>
  )
}

