import Image from "next/image"
import { Minus, Plus } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"

interface ReturnedItem {
  produkId: number
  nama: string
  kuantitas: number
  harga: number
  image: string
  maxKuantitas: number
}

interface ReturnedItemsProps {
  items: ReturnedItem[]
  onItemsChange: (newItems: ReturnedItem[]) => void
}

export function ReturnedItems({ items, onItemsChange }: ReturnedItemsProps) {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-bold mb-2">Produk yang Dikembalikan</h3>
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
                    i.produkId === item.produkId ? { ...i, kuantitas: Math.max(0, i.kuantitas - 1) } : i,
                  )
                  onItemsChange(newItems)
                }}
                disabled={item.kuantitas === 0}
                className="p-1 bg-gray-200 rounded-full disabled:opacity-50"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="mx-2">{item.kuantitas}</span>
              <button
                onClick={() => {
                  const newItems = items.map((i) =>
                    i.produkId === item.produkId ? { ...i, kuantitas: Math.min(i.maxKuantitas, i.kuantitas + 1) } : i,
                  )
                  onItemsChange(newItems)
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
  )
}

