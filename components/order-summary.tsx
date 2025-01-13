'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Minus, Plus, Trash2 } from 'lucide-react'
import Image from "next/image"
import type { Order, Produk } from "@/types/menu"

interface OrderSummaryProps {
  order: Order
  onUpdateQuantity?: (itemId: string, quantity: number) => void
  onEditItem?: (item: Produk) => void
  onDeleteItem?: (itemId: string) => void
  onPlaceOrder?: () => void
}

export function OrderSummary({ order, onUpdateQuantity, onEditItem, onDeleteItem, onPlaceOrder }: OrderSummaryProps) {
  return (
    <div className="p-4 border-l min-w-[400px] flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Order #{order.id}</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {order.items.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No Item Selected
          </div>
        ) : (
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                <div className="relative w-16 h-16">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{item.name}</h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => onEditItem?.(item)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => onDeleteItem?.(item.id)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-500">${item.price.toFixed(2)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (item.quantity > 1) {
                        onUpdateQuantity?.(item.id, item.quantity - 1)
                      }
                    }}
                    disabled={item.quantity <= 1}
                    className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity?.(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4 pt-4 border-t mt-4">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax (10%)</span>
          <span>${order.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>${(order.total + order.tax).toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Add Promo or Voucher" />
          <Button variant="outline" className="shrink-0">Apply</Button>
        </div>
        <Button className="w-full">Payment Method</Button>
        <Button 
          className="w-full" 
          variant="default"
          onClick={onPlaceOrder}
        >
          Place Order
        </Button>
      </div>
    </div>
  )
}

