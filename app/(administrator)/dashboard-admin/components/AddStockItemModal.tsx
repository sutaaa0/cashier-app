import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"

interface AddStockItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddItem: (item: Omit<StockData, "id" | "lastUpdated">) => void
}

export function AddStockItemModal({ isOpen, onClose, onAddItem }: AddStockItemModalProps) {
  const [name, setName] = useState("")
  const [currentStock, setCurrentStock] = useState("")
  const [minStock, setMinStock] = useState("")
  const [category, setCategory] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAddItem({
      name,
      currentStock: Number.parseInt(currentStock),
      minStock: Number.parseInt(minStock),
      category,
    })
    onClose()
    // Reset form
    setName("")
    setCurrentStock("")
    setMinStock("")
    setCategory("")
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add New Stock Item</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 font-bold">
              Item Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          <div>
            <label htmlFor="currentStock" className="block mb-1 font-bold">
              Current Stock
            </label>
            <input
              type="number"
              id="currentStock"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
              min="0"
            />
          </div>
          <div>
            <label htmlFor="minStock" className="block mb-1 font-bold">
              Minimum Stock
            </label>
            <input
              type="number"
              id="minStock"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
              min="0"
            />
          </div>
          <div>
            <label htmlFor="category" className="block mb-1 font-bold">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Add Item
          </button>
        </form>
      </div>
    </div>
  )
}

