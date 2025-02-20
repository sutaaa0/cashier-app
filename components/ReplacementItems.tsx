import Image from "next/image"
import { Minus, Plus, Trash2 } from "lucide-react"
import type { Produk } from "@prisma/client"
import { formatRupiah } from "@/lib/formatIdr"

interface ReplacementItem {
  produkId: number
  nama: string
  kuantitas: number
  harga: number
  image: string
}

interface ReplacementItemsProps {
  items: ReplacementItem[]
  allProducts: Produk[]
  onItemsChange: (newItems: ReplacementItem[]) => void
}

export function ReplacementItems({ items, allProducts, onItemsChange }: ReplacementItemsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-2">Produk Pengganti</h3>
      <select
        onChange={(e) => {
          const selectedProduct = allProducts.find((p) => p.produkId === Number(e.target.value))
          if (selectedProduct) {
            const newItems = [...items, { ...selectedProduct, kuantitas: 1 }]
            onItemsChange(newItems)
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
        {items.map((item, index) => (
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
                  const newItems = items.map((i) =>
                    i.produkId === item.produkId ? { ...i, kuantitas: Math.max(1, i.kuantitas - 1) } : i,
                  )
                  onItemsChange(newItems)
                }}
                className="p-1 bg-gray-200 rounded-full"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="mx-2">{item.kuantitas}</span>
              <button
                onClick={() => {
                  const newItems = items.map((i) =>
                    i.produkId === item.produkId ? { ...i, kuantitas: i.kuantitas + 1 } : i,
                  )
                  onItemsChange(newItems)
                }}
                className="p-1 bg-gray-200 rounded-full"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  const newItems = items.filter((i) => i.produkId !== item.produkId)
                  onItemsChange(newItems)
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
  )
}

