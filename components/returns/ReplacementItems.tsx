"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import { getAllProducts } from "@/server/actions"
import { formatRupiah } from "@/lib/formatIdr"

interface ReplacementItemsProps {
  items: any[]
  setItems: (items: any[]) => void
  setTotalReplacement: (total: number) => void
}

export function ReplacementItems({ items, setItems, setTotalReplacement }: ReplacementItemsProps) {
  const [allProducts, setAllProducts] = useState<any[]>([])

  useEffect(() => {
    const fetchProducts = async () => {
      const products = await getAllProducts()
      setAllProducts(products)
    }
    fetchProducts()
  }, [])

  const addReplacementItem = (productId: number) => {
    const product = allProducts.find((p) => p.produkId === productId)
    if (product) {
      const newItems = [...items, { ...product, kuantitas: 1 }]
      setItems(newItems)
      updateTotalReplacement(newItems)
    }
  }

  const updateItemQuantity = (produkId: number, change: number) => {
    const newItems = items.map((item) =>
      item.produkId === produkId ? { ...item, kuantitas: Math.max(1, item.kuantitas + change) } : item,
    )
    setItems(newItems)
    updateTotalReplacement(newItems)
  }

  const removeItem = (produkId: number) => {
    const newItems = items.filter((item) => item.produkId !== produkId)
    setItems(newItems)
    updateTotalReplacement(newItems)
  }

  const updateTotalReplacement = (newItems: any[]) => {
    const total = newItems.reduce((sum, item) => sum + item.harga * item.kuantitas, 0)
    setTotalReplacement(total)
  }

  return (
    <div className="border-4 border-black p-4 bg-white">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Produk Pengganti</h2>
      <select
        onChange={(e) => addReplacementItem(Number(e.target.value))}
        className="w-full px-2 py-1 border-2 border-black mb-4"
      >
        <option value="">Pilih produk pengganti</option>
        {allProducts.map((product) => (
          <option key={product.produkId} value={product.produkId}>
            {product.nama} - {formatRupiah(product.harga)}
          </option>
        ))}
      </select>
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
                className="p-1 bg-gray-200 rounded-full hover:bg-[#FFD700]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="mx-2 font-bold">{item.kuantitas}</span>
              <button
                onClick={() => updateItemQuantity(item.produkId, 1)}
                className="p-1 bg-gray-200 rounded-full hover:bg-[#FFD700]"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => removeItem(item.produkId)}
                className="ml-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

