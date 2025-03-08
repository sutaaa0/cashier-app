"use client"

import Image from "next/image"
import { Minus, Plus, Tag } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"

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

interface ReturnedItemsProps {
  items: ReturnedItem[];
  setItems: (items: ReturnedItem[]) => void;
  setTotalReturn: (total: number) => void;
}

export function ReturnedItems({ items, setItems, setTotalReturn }: ReturnedItemsProps) {
  const updateItemQuantity = (produkId: number, change: number) => {
    const newItems = items.map((item) =>
      item.produkId === produkId
        ? { ...item, kuantitas: Math.max(0, Math.min(item.maxKuantitas, item.kuantitas + change)) }
        : item,
    )
    setItems(newItems)
    
    // Calculate total using effective price (after discounts)
    const total = newItems.reduce((sum, item) => sum + item.effectivePrice * item.kuantitas, 0)
    setTotalReturn(total)
  }
  
  // Calculate discount percentage from original price to effective price
  const calculateDiscountPercent = (original: number, effective: number) => {
    if (original <= 0) return 0
    const discountPercent = ((original - effective) / original) * 100
    return Math.round(discountPercent)
  }

  return (
    <div className="border-4 border-black p-4 bg-white">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Produk yang Dikembalikan</h2>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.produkId} className="flex items-center justify-between p-2 border-2 border-black">
            <div className="flex items-center gap-4">
              <Image src={item.image || "/placeholder.svg"} alt={item.nama} width={50} height={50} />
              <div>
                <p className="font-bold">{item.nama}</p>
                <div className="flex items-center gap-2">
                  {item.effectivePrice < item.harga ? (
                    <>
                      <span className="line-through text-gray-500 text-sm">{formatRupiah(item.harga)}</span>
                      <span className="font-semibold">{formatRupiah(item.effectivePrice)}</span>
                      <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-md flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {item.discountPercentage 
                          ? `-${item.discountPercentage}%` 
                          : `-${calculateDiscountPercent(item.harga, item.effectivePrice)}%`}
                      </span>
                    </>
                  ) : (
                    <span>{formatRupiah(item.harga)}</span>
                  )}
                </div>
                {item.promotionTitle && (
                  <p className="text-xs text-blue-600">{item.promotionTitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => updateItemQuantity(item.produkId, -1)}
                disabled={item.kuantitas === 0}
                className="p-1 bg-gray-200 rounded-full disabled:opacity-50 hover:bg-[#FFD700]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="mx-2 font-bold">{item.kuantitas}</span>
              <button
                onClick={() => updateItemQuantity(item.produkId, 1)}
                disabled={item.kuantitas === item.maxKuantitas}
                className="p-1 bg-gray-200 rounded-full disabled:opacity-50 hover:bg-[#FFD700]"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}