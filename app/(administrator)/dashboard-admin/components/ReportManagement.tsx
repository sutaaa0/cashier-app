"use client"

import { useState } from 'react'
import { Package, Plus, Minus, AlertTriangle } from 'lucide-react'

interface StockData {
  id: number
  name: string
  currentStock: number
  minStock: number
  category: string
  lastUpdated: string
}

const mockStock: StockData[] = [
  { id: 1, name: 'Coffee Beans', currentStock: 50, minStock: 20, category: 'Ingredients', lastUpdated: '2023-06-01' },
  { id: 2, name: 'Milk', currentStock: 30, minStock: 15, category: 'Dairy', lastUpdated: '2023-06-02' },
  { id: 3, name: 'Sugar', currentStock: 40, minStock: 10, category: 'Ingredients', lastUpdated: '2023-06-03' },
]

export function StockManagement() {
  const [stock, setStock] = useState<StockData[]>(mockStock)

  const handleUpdateStock = (id: number, increment: boolean) => {
    setStock(stock.map(item => 
      item.id === id ? { ...item, currentStock: increment ? item.currentStock + 1 : item.currentStock - 1 } : item
    ))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">STOCK MANAGEMENT</h2>
        <button className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
          <Plus size={20} />
          Add New Item
        </button>
      </div>
      <div className="grid gap-4">
        {stock.map(item => (
          <div key={item.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#93B8F3] border-[3px] border-black">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <span className="inline-block px-2 py-1 bg-black text-white text-sm">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm">Last Updated: {item.lastUpdated}</span>
                    {item.currentStock <= item.minStock && (
                      <span className="flex items-center text-red-500 text-sm font-bold">
                        <AlertTriangle size={16} className="mr-1" />
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-[#93B8F3] border-[3px] border-black">
                  <button 
                    onClick={() => handleUpdateStock(item.id, false)}
                    disabled={item.currentStock <= 0}
                    className="p-1 hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="font-bold min-w-[40px] text-center">{item.currentStock}</span>
                  <button 
                    onClick={() => handleUpdateStock(item.id, true)}
                    className="p-1 hover:bg-black hover:text-white"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

