"use client";

import { useState, forwardRef, useImperativeHandle, useCallback } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Penjualan, DetailPenjualan, Produk } from "@prisma/client";
import { NeoCustomerInput } from "./CustomerInput";
import { toast } from "@/hooks/use-toast";
import { getMemberPoints, redeemPoints } from "@/server/actions";
import { Button } from "./ui/button";

interface OrderSummaryProps {
  order: Penjualan & { detailPenjualan: (DetailPenjualan & { produk: Produk })[] };
  onUpdateQuantity?: (produkId: number, quantity: number) => void;
  onEditItem?: (item: DetailPenjualan & { produk: Produk }) => void;
  onDeleteItem?: (produkId: number) => void;
  onPlaceOrder?: (orderData: Penjualan & { redeemedPoints?: number; pelangganId?: number; guestId?: number }) => void;
  isLoading: boolean;
}

export const NeoOrderSummary = forwardRef<{ resetCustomerData: () => void }, OrderSummaryProps>(({ order, onUpdateQuantity, onEditItem, onDeleteItem, onPlaceOrder, isLoading }, ref) => {
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [customerData, setCustomerData] = useState<{ pelangganId?: number; guestId?: number; nama?: string; alamat?: string; nomorTelepon?: string } | null>(null);
  const [memberPoints, setMemberPoints] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  useImperativeHandle(ref, () => ({
    resetCustomerData: () => {
      setCustomerData(null);
      setShowCustomerInput(false);
      setMemberPoints(0);
      setRedeemedPoints(0);
    },
  }));

  const formatTotal = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const handleCustomerSubmit = async (data: { pelangganId?: number; guestId?: number; nama?: string; alamat?: string; nomorTelepon?: string }) => {
    setCustomerData(data);
    setShowCustomerInput(false);
    if (data.pelangganId) {
      const points = await getMemberPoints(data.pelangganId);
      setMemberPoints(points);
    }
    toast({
      title: "Berhasil",
      description: "Data pelanggan berhasil disimpan",
    });
  };

  const handlePlaceOrder = () => {
    if (onPlaceOrder) {
      const totalAfterDiscount = Math.max(order.total_harga - redeemedPoints, 0);
      const hargaFinal = totalAfterDiscount + redeemedPoints;
      onPlaceOrder({
        ...order,
        total_harga: hargaFinal,
        pelangganId: customerData?.pelangganId,
        guestId: customerData?.guestId,
        redeemedPoints: redeemedPoints,
      });
    }
  };

  const handleRedeemPoints = useCallback(async () => {
    if (customerData?.pelangganId) {
      try {
        const points = await getMemberPoints(customerData.pelangganId);
        if (points > 0) {
          const redeemed = await redeemPoints(customerData.pelangganId, points);
          setRedeemedPoints(redeemed);
          setMemberPoints(points - redeemed);
        }
      } catch (error) {
        console.error("Error redeeming points:", error);
        toast({
          title: "Error",
          description: "Gagal menukarkan poin",
          variant: "destructive",
        });
      }
    }
  }, [customerData]);

  return (
    <div className="p-4 border-4 border-black w-[500px] flex flex-col h-[calc(100vh-100px)] bg-[#e8f1fe] font-mono overflow-y-scroll">
      <div className="flex-1 overflow-y-auto">
        {order.detailPenjualan.length === 0 ? (
          <div className="text-center text-black py-8 font-bold">No Item Selected</div>
        ) : (
          <div className="space-y-4">
            {order.detailPenjualan.map((item) => (
              <div key={item.produkId} className="flex items-center gap-4 bg-white p-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="relative w-16 h-16 border-2 border-black">
                  <Image src={item.produk.image || "/placeholder.svg"} alt={item.produk.nama} fill className="object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold">{item.produk.nama}</h3>
                  </div>
                  <div className="text-black">Rp{item.produk.harga.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={() => onDeleteItem?.(item.produkId)} className="w-8 h-8 flex bg-red-500 items-center justify-center border-2 border-black hover:bg-black hover:text-white">
                    <Trash2 className="h-4 w-4 text-white" />
                  </Button>
                  <button
                    onClick={() => {
                      if (item.kuantitas > 1) {
                        onUpdateQuantity?.(item.produkId, item.kuantitas - 1);
                      }
                    }}
                    disabled={item.kuantitas <= 1}
                    className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-4 text-center">{item.kuantitas}</span>
                  <button onClick={() => onUpdateQuantity?.(item.produkId, item.kuantitas + 1)} className="w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-white">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {redeemedPoints > 0 && (
            <div className="flex justify-between text-green-600 font-bold">
              <span>Potongan Poin</span>
              <span>-Rp{formatTotal(redeemedPoints)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xl">
            <span>TOTAL</span>
            <span>Rp{formatTotal(order.total_harga - redeemedPoints)}</span>
          </div>
          {customerData?.pelangganId && (
            <div className="flex justify-between items-center">
              <span className="font-bold">Poin Member: {memberPoints}</span>
              <button 
                onClick={handleRedeemPoints} 
                disabled={memberPoints === 0 || redeemedPoints > 0}
                className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tukar Poin
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input 
              placeholder="Add Promo or Voucher" 
              className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-bold"  
            />
            <button className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors">
              Apply
            </button>
          </div>
          <button className="w-full px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors">
            Payment Method
          </button>
          {showCustomerInput ? (
            <NeoCustomerInput onSubmit={handleCustomerSubmit} onCancel={() => setShowCustomerInput(false)} />
          ) : (
            <button 
              className="w-full px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-black hover:text-white transition-colors" 
              onClick={() => setShowCustomerInput(true)}
            >
              {customerData ? `${customerData.pelangganId ? 'Member' : 'Guest'}: ${customerData.nama || 'Unknown'}` : "Enter Customer Information"}
            </button>
          )}
          <button 
            className="w-full px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors" 
            onClick={handlePlaceOrder} 
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    )
  }
)

      <div className="space-y-4 pt-4 border-t-4 border-black mt-4 py-2">
        <div className="flex justify-between text-black font-bold">
          <span>Subtotal</span>
          <span>{formatTotal(order.total_harga)}</span>
        </div>
        {redeemedPoints > 0 && (
          <div className="flex justify-between text-green-600 font-bold">
            <span>Potongan Poin</span>
            <span>-{formatTotal(redeemedPoints)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-xl">
          <span>TOTAL</span>
          <span>{formatTotal(order.total_harga - redeemedPoints)}</span>
        </div>
        {customerData?.pelangganId && (
          <div className="flex justify-between items-center">
            <span className="font-bold">Poin Member: {memberPoints}</span>
            <button
              onClick={handleRedeemPoints}
              disabled={memberPoints === 0 || redeemedPoints > 0}
              className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tukar Poin
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input placeholder="Add Promo or Voucher" className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-black font-bold" />
          <button className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors">Terapkan</button>
        </div>
        <button className="w-full px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors">Metode Pembayaran</button>
        {showCustomerInput ? (
          <NeoCustomerInput onSubmit={handleCustomerSubmit} onCancel={() => setShowCustomerInput(false)} />
        ) : (
          <button className="w-full px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-black hover:text-white transition-colors" onClick={() => setShowCustomerInput(true)}>
            {customerData ? `${customerData.pelangganId ? "Member" : "Guest"}: ${customerData.nama || "Unknown"}` : "Masukkan Informasi Pelanggan"}
          </button>
        )}
        <button className="w-full px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors" onClick={handlePlaceOrder} disabled={isLoading}>
          {isLoading ? "Memproses..." : "Pesan"}
        </button>
      </div>
    </div>
  );
});

