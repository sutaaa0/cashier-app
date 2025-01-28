import { Package, AlertTriangle } from "lucide-react"

const lowStockProducts = [
  { id: 1, name: "Roti Tawar", stock: 5, minStock: 10 },
  { id: 2, name: "Donat Coklat", stock: 8, minStock: 15 },
  { id: 3, name: "Kopi Arabica", stock: 3, minStock: 8 },
  { id: 4, name: "Croissant", stock: 6, minStock: 12 },
]

export function InventoryManagement() {
  return (
    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
      <h2 className="text-2xl font-bold mb-4">Manajemen Inventaris</h2>
      <div className="space-y-4">
        {lowStockProducts.map((product) => (
          <div key={product.id} className="flex items-center justify-between p-3 border-2 border-black bg-yellow-100">
            <div className="flex items-center">
              <Package size={20} className="mr-2" />
              <div>
                <p className="font-bold">{product.name}</p>
                <p className="text-sm">Stok: {product.stock}</p>
              </div>
            </div>
            <div className="flex items-center">
              <AlertTriangle size={20} className="text-red-500 mr-2" />
              <span className="text-sm font-bold">Minimum: {product.minStock}</span>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-4 w-full bg-black text-white font-bold py-2 px-4 border-2 border-black hover:bg-white hover:text-black transition-colors">
        Lihat Semua Produk
      </button>
    </div>
  )
}

