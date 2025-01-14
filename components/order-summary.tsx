"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Minus, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Penjualan, DetailPenjualan, Produk } from "@prisma/client";
import { CustomerInput } from "./CustomerInput";
import { createCustomer } from "@/server/actions";
import { toast } from "@/hooks/use-toast";

interface OrderSummaryProps {
  order: Penjualan & { detailPenjualan: (DetailPenjualan & { produk: Produk })[] };
  onUpdateQuantity?: (produkId: number, quantity: number) => void;
  onEditItem?: (item: DetailPenjualan & { produk: Produk }) => void;
  onDeleteItem?: (produkId: number) => void;
  onPlaceOrder?: (customerData: { nama: string; alamat: string; nomorTelepon: string }) => void;
}

export function OrderSummary({ order, onUpdateQuantity, onEditItem, onDeleteItem, onPlaceOrder }: OrderSummaryProps) {
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [customerData, setCustomerData] = useState<{ nama: string; alamat: string; nomorTelepon: string } | null>(null);

  const formatTotal = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const handleCustomerSubmit = async (data: { nama: string; alamat: string; nomorTelepon: string }) => {
    try {
      const result = await createCustomer(data);
      if (result.status === "Success") {
        setCustomerData(data);
        setShowCustomerInput(false);
        
        if (onPlaceOrder) {
          onPlaceOrder(result.data);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data pelanggan",
        variant: "destructive"
      });
    }
  };

  const handlePlaceOrder = () => {
    if (customerData && onPlaceOrder) {
      onPlaceOrder(customerData);
    } else {
      setShowCustomerInput(true);
    }
  };

  return (
    <div className="p-4 border-l min-w-[400px] flex flex-col h-[calc(100vh-64px)]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Order #{order.penjualanId}</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {order.detailPenjualan.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">No Item Selected</div>
        ) : (
          <div className="space-y-4">
            {order.detailPenjualan.map((item) => (
              <div key={item.produkId} className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg">
                <div className="relative w-16 h-16">
                  <Image src={item.produk.image} alt={item.produk.nama} fill className="object-cover rounded-lg" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{item.produk.nama}</h3>
                    <div className="flex items-center gap-2">
                      <button onClick={() => onEditItem?.(item)} className="text-gray-400 hover:text-gray-600">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => onDeleteItem?.(item.produkId)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-gray-500">Rp{item.produk.harga.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (item.kuantitas > 1) {
                        onUpdateQuantity?.(item.produkId, item.kuantitas - 1);
                      }
                    }}
                    disabled={item.kuantitas <= 1}
                    className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-4 text-center">{item.kuantitas}</span>
                  <button onClick={() => onUpdateQuantity?.(item.produkId, item.kuantitas + 1)} className="w-8 h-8 flex items-center justify-center border rounded-full hover:bg-gray-100">
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
          <span>Rp{formatTotal(order.total_harga)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>TOTAL</span>
          <span>Rp{order.total_harga.toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Add Promo or Voucher" />
          <Button variant="outline" className="shrink-0">
            Apply
          </Button>
        </div>
        <Button className="w-full">Payment Method</Button>
        {showCustomerInput ? (
          <CustomerInput onSubmit={handleCustomerSubmit} onCancel={() => setShowCustomerInput(false)} />
        ) : (
          <Button className="w-full" variant="default" onClick={handlePlaceOrder}>
            {customerData ? "Place Order" : "Enter Customer Information"}
          </Button>
        )}
      </div>
    </div>
  );
}
