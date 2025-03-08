"use client"

import { useState } from "react"
import { RecentTransactions } from "./RecentTransactions"
import { TransactionDetails } from "./TransactionDetails"
import { ReturnedItems } from "./ReturnedItems"
import { ReplacementItems } from "./ReplacementItems"
import { RefundSummary } from "./RefundSummary"
import { RefundReceiptModal } from "./RefundReceiptModal"
import { toast } from "@/hooks/use-toast"
import { processReturn, getTransactionDetails, getActivePromotions } from "@/server/actions"

interface TransactionDetail {
  produkId: number;
  produk: {
    nama: string;
    harga: number;
    image: string;
    hargaModal: number;
  };
  kuantitas: number;
  subtotal: number;
  promotionId?: number;
  promotionTitle?: string;
  discountPercentage?: number;
  discountAmount?: number;
}

interface TransactionDetailsType {
  detailPenjualan: TransactionDetail[];
  penjualanId: number;
  tanggalPenjualan: string;
  total_harga: number;
  uangMasuk: number;
  kembalian: number;
  diskonPoin?: number;
  user?: {
    username: string;
  };
  pelanggan?: {
    nama: string;
    points?: number;
  };
}

interface ReturnedItem {
  produkId: number;
  nama: string;
  kuantitas: number;
  harga: number; // Original price
  effectivePrice: number; // Price after discounts
  image: string;
  maxKuantitas: number;
  promotionTitle?: string;
  discountPercentage?: number;
  discountAmount?: number;
}

interface Promotion {
  promotionId: number;
  title: string;
  discountPercentage?: number;
  discountAmount?: number;
  produkIds: number[];
}

interface ReplacementItem {
  produkId: number;
  nama: string;
  kuantitas: number;
  harga: number; // Original price
  effectivePrice: number; // Price after discounts
  image: string;
  promotionTitle?: string;
  discountPercentage?: number;
  discountAmount?: number;
}

interface RefundDetails {
  transactionDetails: {
    penjualanId: number;
    tanggalPenjualan: string;
    diskonPoin?: number;
    user?: {
      username: string;
    };
    pelanggan?: {
      nama: string;
      points?: number;
    };
  };
  returnedItems: ReturnedItem[];
  replacementItems: ReplacementItem[];
  totalReturn: number;
  totalReplacement: number;
  additionalPayment: number;
  returnHistory?: any[];
}

export function ReturnsPage() {
  const [penjualanId, setPenjualanId] = useState<string>("")
  const [refundDetails, setRefundDetails] = useState<RefundDetails | null>(null)
  const [transactionDetails, setTransactionDetails] = useState<TransactionDetailsType | null>(null)
  const [returnedItems, setReturnedItems] = useState<ReturnedItem[]>([])
  const [replacementItems, setReplacementItems] = useState<ReplacementItem[]>([])
  const [activePromotions, setActivePromotions] = useState<Promotion[]>([])
  const [totalReturn, setTotalReturn] = useState(0)
  const [totalReplacement, setTotalReplacement] = useState(0)
  const [additionalPayment, setAdditionalPayment] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showRefundReceipt, setShowRefundReceipt] = useState(false)

  const fetchTransactionDetails = async (id: string) => {
    setIsLoading(true)
    try {
      const details = await getTransactionDetails(Number(id))
      if (!details) {
        toast({
          title: "Error",
          description: "Transaksi tidak ditemukan",
          variant: "destructive",
        })
        return
      }
      
      // Also fetch active promotions for replacement items
      const promotions = await getActivePromotions()
      setActivePromotions(promotions || [])
      
      setTransactionDetails({
        penjualanId: details.penjualanId,
        tanggalPenjualan: details.tanggalPenjualan.toString(),
        detailPenjualan: details.detailPenjualan,
        total_harga: details.total_harga,
        uangMasuk: details.uangMasuk ?? 0,
        kembalian: details.kembalian ?? 0,
        diskonPoin: details.diskonPoin ?? 0,
        user: { username: details.user.username },
        pelanggan: details.pelanggan ? { 
          nama: details.pelanggan.nama,
          points: details.pelanggan.points 
        } : undefined
      })
      
      // Calculate effective price for each item based on discounts
      setReturnedItems(
        details.detailPenjualan.map((item: TransactionDetail) => {
          // Calculate effective price after discounts
          let effectivePrice = item.produk.harga
          if (item.discountPercentage) {
            effectivePrice = Math.round(effectivePrice * (1 - (item.discountPercentage / 100)))
          } else if (item.discountAmount) {
            effectivePrice = Math.round(effectivePrice - (item.discountAmount || 0))
          }
          
          return {
            produkId: item.produkId,
            nama: item.produk.nama,
            kuantitas: 0,
            harga: item.produk.harga, // Original price
            effectivePrice: effectivePrice, // Price after discounts
            image: item.produk.image,
            maxKuantitas: item.kuantitas,
            promotionTitle: item.promotionTitle,
            discountPercentage: item.discountPercentage,
            discountAmount: item.discountAmount,
          }
        }),
      )
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

  const handleTransactionSelect = async (id: number) => {
    setPenjualanId(id.toString())
    await fetchTransactionDetails(id.toString())
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
      // Format returned items with discount information
      const returnItems = returnedItems
        .filter((item) => item.kuantitas > 0)
        .map(item => ({
          produkId: item.produkId,
          kuantitas: item.kuantitas,
          harga: item.effectivePrice, // Use the effective (discounted) price
          discountPercentage: item.discountPercentage,
          discountAmount: item.discountAmount,
          promotionTitle: item.promotionTitle
        }))
        
      // Format replacement items with discount information
      const replaceItems = replacementItems.map(item => ({
        produkId: item.produkId,
        kuantitas: item.kuantitas,
        harga: item.effectivePrice, // Use the effective (discounted) price
        discountPercentage: item.discountPercentage,
        discountAmount: item.discountAmount,
        promotionTitle: item.promotionTitle
      }))
      
      const result = await processReturn({
        penjualanId: Number(penjualanId),
        userId: 1, // Replace with actual user ID
        returnedItems: returnItems,
        replacementItems: replaceItems,
        totalReturn,
        totalReplacement,
        additionalPayment,
      })

      if (!transactionDetails) return;
      
      setRefundDetails({
        transactionDetails: {
          penjualanId: transactionDetails.penjualanId,
          tanggalPenjualan: transactionDetails.tanggalPenjualan,
          diskonPoin: transactionDetails.diskonPoin,
          user: transactionDetails.user,
          pelanggan: transactionDetails.pelanggan
        },
        returnedItems: returnedItems.filter((item) => item.kuantitas > 0),
        replacementItems,
        totalReturn,
        totalReplacement,
        additionalPayment,
        returnHistory: result.returnHistory
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

  return (
    <div className="container mx-auto p-4 font-mono">
      <h1 className="text-4xl font-black mb-8 transform -rotate-2 inline-block relative">
        PENGEMBALIAN BARANG
        <div className="absolute -bottom-1 left-0 w-full h-3 bg-[#FFD700] -z-10 transform -rotate-1"></div>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <RecentTransactions onSelectTransaction={handleTransactionSelect} />
          <TransactionDetails
            penjualanId={penjualanId}
            setPenjualanId={setPenjualanId}
            fetchTransactionDetails={fetchTransactionDetails}
            transactionDetails={transactionDetails}
          />
        </div>
        <div className="space-y-8">
          <ReturnedItems 
            items={returnedItems} 
            setItems={setReturnedItems} 
            setTotalReturn={setTotalReturn} 
          />
          <ReplacementItems
            items={replacementItems}
            setItems={setReplacementItems}
            setTotalReplacement={setTotalReplacement}
            activePromotions={activePromotions}
          />
        </div>
      </div>

      <RefundSummary
        totalReturn={totalReturn}
        totalReplacement={totalReplacement}
        additionalPayment={additionalPayment}
        setAdditionalPayment={setAdditionalPayment}
        diskonPoin={transactionDetails?.diskonPoin}
      />

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleReturn}
          disabled={isLoading || (totalReplacement > totalReturn && additionalPayment < totalReplacement - totalReturn)}
          className="px-6 py-3 bg-[#FFD700] text-black font-bold text-lg border-4 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          {isLoading ? "Memproses..." : "Proses Pengembalian"}
        </button>
      </div>

      {showRefundReceipt && refundDetails && (
        <RefundReceiptModal
          isOpen={showRefundReceipt}
          onClose={() => setShowRefundReceipt(false)}
          data={refundDetails}
        />
      )}
    </div>
  )
}