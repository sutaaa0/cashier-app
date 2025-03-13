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
import { Button } from "../ui/button"

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
  promotionId: number | null;
  promotionTitle: string | null | undefined;
  discountPercentage?: number | null;
  discountAmount?: number | null;
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

interface DiscountInfo {
  percentage?: number;
  amount?: number;
  promotionTitle?: string;
}

interface ReturnHistoryItem {
  type: 'return' | 'replacement';
  produkId: number;
  produkName: string;
  quantity: number;
  originalPrice: number;
  effectivePrice: number;
  discount?: DiscountInfo;
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
  returnHistory?: ReturnHistoryItem[];
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
          description: "Transaction not found",
          variant: "destructive",
        })
        return
      }
      
      // Also fetch active promotions for replacement items
      const promotions = await getActivePromotions()
      setActivePromotions((promotions || []).map(promotion => ({
        ...promotion,
        discountPercentage: promotion.discountPercentage === null ? undefined : promotion.discountPercentage,
        discountAmount: promotion.discountAmount === null ? undefined : promotion.discountAmount,
      })))
      
      setTransactionDetails({
        penjualanId: details.penjualanId,
        tanggalPenjualan: details.tanggalPenjualan.toString(),
        detailPenjualan: details.detailPenjualan.map((item) => ({
                  ...item,
                  promotionId: item.promotionId ?? null,
                  promotionTitle: item.promotionTitle === null ? undefined : item.promotionTitle,
                  discountPercentage: item.discountPercentage === null ? undefined : item.discountPercentage,
                  discountAmount: item.discountAmount === null ? undefined : item.discountAmount,
                })) as TransactionDetail[],
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
            promotionTitle: item.promotionTitle === null ? undefined : item.promotionTitle,
            discountPercentage: item.discountPercentage === null ? undefined : item.discountPercentage,
            discountAmount: item.discountAmount === null ? undefined : item.discountAmount,
          }
        }),
      )
    } catch (error) {
      console.error("Error fetching transaction details:", error)
      toast({
        title: "Error",
        description: "Failed to retrieve transaction details",
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
        description: "Please select the product you want to return",
        variant: "destructive",
      })
      return
    }

    const difference = totalReplacement - totalReturn
    if (difference > 0 && additionalPayment < difference) {
      toast({
        title: "Error",
        description: "Insufficient additional payment",
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
          discountPercentage: item.discountPercentage ?? null,
          discountAmount: item.discountAmount ?? null,
        }))
        
      // Format replacement items with discount information
      const replaceItems = replacementItems.map(item => ({
        produkId: item.produkId,
        kuantitas: item.kuantitas,
        harga: item.effectivePrice, // Use the effective (discounted) price
        discountPercentage: item.discountPercentage ?? null,
        discountAmount: item.discountAmount ?? null,
        promotionTitle: item.promotionTitle ?? ""
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
        returnHistory: (result.returnHistory as ReturnHistoryItem[]).map((item) => ({
          ...item,
          type: item.type === "return" || item.type === "replacement" ? item.type : "return"
        }))
      })

      setShowRefundReceipt(true)

      toast({
        title: "Success",
        description: "Return processed successfully",
      })

      // Reset the form
      setPenjualanId("")
      setTransactionDetails(null)
      setReturnedItems([])
      setReplacementItems([])
      setTotalReturn(0)
      setTotalReplacement(0)

    } catch (error) {
      console.error("Error processing return:", error)
      toast({
        title: "Error",
        description: "Failed to process the return",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4 font-mono">
      <h1 className="text-4xl font-black mb-8 transform -rotate-2 inline-block relative">
      RETURN OF PRODUCTS
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
        <Button
          onClick={handleReturn}
          disabled={isLoading || (totalReplacement > totalReturn && additionalPayment < totalReplacement - totalReturn)}
          className="px-6 py-3 bg-[#FFD700] text-black font-bold"
        >
          {isLoading ? "Processing..." : "Return Process"}
        </Button>
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