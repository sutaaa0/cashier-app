"use client"

import Image from "next/image"
import { Minus, Plus } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"

interface ReturnedItemsProps {
  items: any[]
  setItems: (items: any[]) => void
  setTotalReturn: (total: number) => void
}

export function ReturnedItems({ items, setItems, setTotalReturn }: ReturnedItemsProps) {
  const updateItemQuantity = (produkId: number, change: number) => {
    const newItems = items.map((item) =>
      item.produkId === produkId
        ? { ...item, kuantitas: Math.max(0, Math.min(item.maxKuantitas, item.kuantitas + change)) }
        : item,
    )
    setItems(newItems)
    const total = newItems.reduce((sum, item) => sum + item.harga * item.kuantitas, 0)
    setTotalReturn(total)
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
                <p>{formatRupiah(item.harga)}</p>
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

