"use client"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { getTransactionDetails, processReturn, getAllProducts } from "@/server/actions"
import type { Produk } from "@prisma/client"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { RefundReceiptModal } from "./RefunReceiptModal"

interface RefundInputProps {
  onRefundComplete: () => void
}

export function NeoRefundInput({ onRefundComplete }: RefundInputProps) {
  const [penjualanId, setPenjualanId] = useState("")
  const [transactionDetails, setTransactionDetails] = useState<any>(null)
  const [returnedItems, setReturnedItems] = useState<
    { produkId: number; nama: string; kuantitas: number; harga: number; image: string; maxKuantitas: number }[]
  >([])
  const [replacementItems, setReplacementItems] = useState<
    { produkId: number; nama: string; kuantitas: number; harga: number; image: string }[]
  >([])
  const [totalReturn, setTotalReturn] = useState(0)
  const [totalReplacement, setTotalReplacement] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [allProducts, setAllProducts] = useState<Produk[]>([])
  const [additionalPayment, setAdditionalPayment] = useState(0)
  const [showRefundReceipt, setShowRefundReceipt] = useState(false)
  const [refundDetails, setRefundDetails] = useState<any>(null)

  const fetchTransactionDetails = async () => {
    setIsLoading(true)
    try {
      const details = await getTransactionDetails(Number(penjualanId))
      if (!details) {
        toast({
          title: "Error",
          description: "Transaksi tidak ditemukan",
          variant: "destructive",
        })
        return
      }
      setTransactionDetails(details)
      setReturnedItems(
        details.detailPenjualan.map((item: any) => ({
          produkId: item.produkId,
          nama: item.produk.nama,
          kuantitas: 0,
          harga: item.produk.harga,
          image: item.produk.image,
          maxKuantitas: item.kuantitas,
        })),
      )
      setAllProducts(await getAllProducts())
    } catch (error) {
      console.error("Error fetching transaction details:", error)
      toast({
        title: "Error",
        description: "Gagal mengambil detail transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const calculateTotalReturn = (items: { produkId: number; nama: string; kuantitas: number; harga: number }[]) => {
    const total = items.reduce((sum, item) => sum + item.harga * item.kuantitas, 0)
    setTotalReturn(total)
    return total // Return the value for immediate use
  }

  const calculateTotalReplacement = (items: { produkId: number; nama: string; kuantitas: number; harga: number }[]) => {
    const total = items.reduce((sum, item) => sum + item.harga * item.kuantitas, 0)
    setTotalReplacement(total)
    return total // Return the value for immediate use
  }

  const handleReturn = async () => {
    if (returnedItems.every((item) => item.kuantitas === 0)) {
      toast({
        title: "Error",
        description: "Silakan pilih produk yang ingin dikembalikan",
        variant: "destructive",
      })
      return
    }

    const difference = totalReplacement - totalReturn
    if (difference > 0 && additionalPayment < difference) {
      toast({
        title: "Error",
        description: "Pembayaran tambahan tidak mencukupi",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const result = await processReturn({
        penjualanId: Number(penjualanId),
        userId: 1, // Replace with actual user ID
        returnedItems: returnedItems.filter((item) => item.kuantitas > 0),
        replacementItems,
        totalReturn,
        totalReplacement,
        additionalPayment,
      })

      // Set the receipt data with the correct structure
      setRefundDetails({
        transactionDetails,
        returnedItems: returnedItems.filter((item) => item.kuantitas > 0),
        replacementItems,
        totalReturn,
        totalReplacement,
        additionalPayment,
      })

      setShowRefundReceipt(true)

      toast({
        title: "Berhasil",
        description: "Pengembalian berhasil diproses",
      })
    } catch (error) {
      console.error("Error processing return:", error)
      toast({
        title: "Error",
        description: "Gagal memproses pengembalian",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount)
  }

  return (
    <div className="bg-white border-4 border-black p-4 font-mono">
      <h2 className="text-2xl font-bold mb-4">Proses Pengembalian</h2>
      <div className="mb-4">
        <label htmlFor="penjualanId" className="block mb-2 font-bold">
          ID Transaksi
        </label>
        <div className="flex gap-2">
          <input
            id="penjualanId"
            value={penjualanId}
            onChange={(e) => setPenjualanId(e.target.value)}
            placeholder="Masukkan ID transaksi"
            disabled={isLoading}
            className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
          <button
            onClick={fetchTransactionDetails}
            disabled={isLoading}
            className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Memuat..." : "Cari"}
          </button>
        </div>
      </div>

      {transactionDetails && (
        <div className="mb-6 p-4 border-2 border-black">
          <h3 className="text-xl font-bold mb-2">Detail Transaksi</h3>
          <p>Tanggal: {new Date(transactionDetails.tanggalPenjualan).toLocaleString()}</p>
          <p>Total: {formatRupiah(transactionDetails.total_harga)}</p>
          <p>Uang Masuk: {formatRupiah(transactionDetails.uangMasuk || 0)}</p>
          <p>Kembalian: {formatRupiah(transactionDetails.kembalian || 0)}</p>
        </div>
      )}

      {returnedItems.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">Produk yang Dikembalikan</h3>
          <div className="space-y-4">
            {returnedItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-2 border-2 border-black">
                <div className="flex items-center gap-4">
                  <Image src={item.image || "/placeholder.svg"} alt={item.nama} width={50} height={50} />
                  <div>
                    <p className="font-bold">{item.nama}</p>
                    <p>{formatRupiah(item.harga)}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => {
                      const newItems = returnedItems.map((i) =>
                        i.produkId === item.produkId ? { ...i, kuantitas: Math.max(0, i.kuantitas - 1) } : i,
                      )
                      setReturnedItems(newItems)
                      calculateTotalReturn(newItems) // Call the function directly
                    }}
                    disabled={item.kuantitas === 0}
                    className="p-1 bg-gray-200 rounded-full disabled:opacity-50"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="mx-2">{item.kuantitas}</span>
                  <button
                    onClick={() => {
                      const newItems = returnedItems.map((i) =>
                        i.produkId === item.produkId
                          ? { ...i, kuantitas: Math.min(i.maxKuantitas, i.kuantitas + 1) }
                          : i,
                      )
                      setReturnedItems(newItems)
                      calculateTotalReturn(newItems) // Call the function directly
                    }}
                    disabled={item.kuantitas === item.maxKuantitas}
                    className="p-1 bg-gray-200 rounded-full disabled:opacity-50"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold mb-2">Produk Pengganti</h3>
        <select
          onChange={(e) => {
            const selectedProduct = allProducts.find((p) => p.produkId === Number(e.target.value))
            if (selectedProduct) {
              const newItems = [...replacementItems, { ...selectedProduct, kuantitas: 1 }]
              setReplacementItems(newItems)
              calculateTotalReplacement(newItems) // Call the function directly
            }
          }}
          className="w-full px-2 py-1 border-2 border-black mb-2"
        >
          <option value="">Pilih produk pengganti</option>
          {allProducts.map((product) => (
            <option key={product.produkId} value={product.produkId}>
              {product.nama} - {formatRupiah(product.harga)}
            </option>
          ))}
        </select>
        <div className="space-y-4">
          {replacementItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-2 border-2 border-black">
              <div className="flex items-center gap-4">
                <Image src={item.image || "/placeholder.svg"} alt={item.nama} width={50} height={50} />
                <div>
                  <p className="font-bold">{item.nama}</p>
                  <p>{formatRupiah(item.harga)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    const newItems = replacementItems.map((i) =>
                      i.produkId === item.produkId ? { ...i, kuantitas: Math.max(1, i.kuantitas - 1) } : i,
                    )
                    setReplacementItems(newItems)
                    calculateTotalReplacement(newItems) // Call the function directly
                  }}
                  className="p-1 bg-gray-200 rounded-full"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="mx-2">{item.kuantitas}</span>
                <button
                  onClick={() => {
                    const newItems = replacementItems.map((i) =>
                      i.produkId === item.produkId ? { ...i, kuantitas: i.kuantitas + 1 } : i,
                    )
                    setReplacementItems(newItems)
                    calculateTotalReplacement(newItems) // Call the function directly
                  }}
                  className="p-1 bg-gray-200 rounded-full"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => {
                    const newItems = replacementItems.filter((i) => i.produkId !== item.produkId)
                    setReplacementItems(newItems)
                    calculateTotalReplacement(newItems)
                  }}
                  className="ml-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
              onChange={(e) => setAdditionalPayment(Number(e.target.value))}
              className="w-full px-2 py-1 border-2 border-black"
              min={0}
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={handleReturn}
          disabled={isLoading || (totalReplacement > totalReturn && additionalPayment < totalReplacement - totalReturn)}
          className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Memproses..." : "Proses Pengembalian"}
        </button>
      </div>

      {showRefundReceipt && refundDetails && (
        <RefundReceiptModal
          isOpen={showRefundReceipt}
          onClose={() => {
            setShowRefundReceipt(false)
            onRefundComplete()
          }}
          data={refundDetails} // Changed from refundDetails to data to match the interface
        />
      )}
    </div>
  )
}

