"use client";

import { useState, forwardRef, useImperativeHandle, useCallback, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { Penjualan, DetailPenjualan } from "@prisma/client";
import { NeoCustomerInput } from "./CustomerInput";
import { toast } from "@/hooks/use-toast";
import { getCurrentUser, getMemberPoints, redeemPoints } from "@/server/actions";
import { Button } from "./ui/button";

interface Produk {
  produkId: number;
  nama: string;
  harga: number;
  stok: number;
  minimumStok: number;
  statusStok: string;
  isDeleted: boolean;
  image: string;
  kategoriId: number;
  createdAt: Date;
  updatedAt: Date;
  kategori: { nama: string };
}

interface OrderSummaryProps {
  order: Penjualan & { detailPenjualan: (DetailPenjualan & { produk: Produk })[] };
  onUpdateQuantity: (produkId: number, quantity: number) => void;
  onEditItem: (item: DetailPenjualan & { produk: Produk }) => void;
  onDeleteItem: (produkId: number) => void;
  onPlaceOrder: (orderData: Penjualan & {
    redeemedPoints?: number;
    uangMasuk?: number;
    kembalian?: number;
    customerName?: string;
    detailPenjualan: (DetailPenjualan & { produk: Produk })[];
  }) => Promise<void>;
  isLoading: boolean;
}

export const NeoOrderSummary = forwardRef<{ resetCustomerData: () => void }, OrderSummaryProps>(({ order, onUpdateQuantity, onDeleteItem, onPlaceOrder, isLoading }, ref) => {
  // State untuk data pelanggan
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [customerData, setCustomerData] = useState<{
    pelangganId?: number;
    guestId?: number;
    nama?: string;
    alamat?: string | null;
    nomorTelepon?: string | null;
  } | null>(null);
  const [memberPoints, setMemberPoints] = useState(0);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [user, setUser] = useState<{ id: number; name: string } | null>(null);

  // State untuk input uang masuk dan tampilan struk
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [receipt, setReceipt] = useState<{
    finalTotal: number;
    amountReceived: number;
    change: number;
  } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser({ id: currentUser.id, name: currentUser.username });
      }
    };
    fetchUser();
  }, []);

  useImperativeHandle(ref, () => ({
    resetCustomerData: () => {
      setCustomerData(null);
      setShowCustomerInput(false);
      setMemberPoints(0);
      setRedeemedPoints(0);
      setAmountReceived(0);
      setReceipt(null);
    },
  }));

  const formatTotal = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const handleCustomerSubmit = async (data: { pelangganId?: number; guestId?: number; nama?: string; alamat?: string | null; nomorTelepon?: string | null }) => {
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
    if (!user) {
      toast({
        title: "Error",
        description: "Silakan login terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    // Hitung total setelah diskon poin
    const finalTotal = Math.max(order.total_harga - redeemedPoints, 0);

    // Validasi uang masuk
    if (amountReceived < finalTotal) {
      toast({
        title: "Error",
        description: "Uang masuk tidak mencukupi untuk pembayaran",
        variant: "destructive",
      });
      return;
    }

    // Hitung kembalian
    const change = amountReceived - finalTotal;

    console.log("uang masuk :", amountReceived);
    console.log("uang kembalian :", change);

    // Panggil fungsi onPlaceOrder dengan mengirim data order lengkap
    onPlaceOrder({
      ...order,
      total_harga: finalTotal,
      pelangganId: customerData?.pelangganId ?? null,
      guestId: customerData?.guestId ?? null,
      redeemedPoints: redeemedPoints,
      userId: user.id,
      uangMasuk: amountReceived,
      kembalian: change,
    });

    // Set receipt untuk menampilkan struk pembayaran
    setReceipt({ finalTotal, amountReceived, change });
  };

  const handleRedeemPoints = useCallback(async () => {
    if (customerData?.pelangganId) {
      try {
        const points = await getMemberPoints(customerData.pelangganId);
        if (points > 0 && points >= 5000) {
          const redeemed = await redeemPoints(customerData.pelangganId, points, order.total_harga);
          setRedeemedPoints(redeemed);
          setMemberPoints(points - redeemed);
          console.log("Poin berhasil diredeem:", redeemed);
        } else {
          toast({
            title: "Error",
            description: "Poin tidak mencukupi, minimum 5000 points",
            variant: "destructive",
          });
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
  }, [customerData, order.total_harga]);

  const handleCancelRedeemPoints = useCallback(() => {
    setRedeemedPoints(0);
    setMemberPoints((prevPoints) => prevPoints + redeemedPoints);
    toast({
      title: "Berhasil",
      description: "Penukaran poin dibatalkan",
    });
  }, [redeemedPoints]);

  return (
    <div className="p-4 border-4 border-black w-[500px] flex flex-col h-[calc(100vh-100px)] bg-[#e8f1fe] font-mono overflow-y-scroll">
      {/* Jika ada struk, tampilkan struk pembayaran */}
      {receipt ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center mb-4">Struk Pembayaran</h2>
          <div className="flex justify-between">
            <span>Total Bayar:</span>
            <span>{formatTotal(receipt.finalTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Uang Masuk:</span>
            <span>{formatTotal(receipt.amountReceived)}</span>
          </div>
          <div className="flex justify-between">
            <span>Kembalian:</span>
            <span>{formatTotal(receipt.change)}</span>
          </div>
          <Button
            onClick={() => {
              // Reset semua data agar bisa memulai transaksi baru
              setReceipt(null);
              setAmountReceived(0);
            }}
            className="w-full mt-4"
          >
            Transaksi Baru
          </Button>
        </div>
      ) : (
        <>
          {order.detailPenjualan.map((item) => (
            <div key={item.produkId} className="flex items-center justify-between py-2 border-b border-gray-200">
              <div className="flex items-center">
                <div
                  className="group cursor-pointer bg-white border-2 border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                  hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200
                  hover:-translate-y-0.5 active:shadow-none active:translate-y-0.5"
                >
                  <div className="relative w-16 h-16 border-2 border-black">
                    <Image src={item.produk.image || "/placeholder.svg"} alt={item.produk.nama} fill className="object-cover" />
                  </div>
                </div>

                <div className="ml-4">
                  <p className="text-lg font-medium">{item.produk.nama}</p>
                  <p className="text-sm text-gray-500">{formatTotal(item.produk.harga)}</p>
                </div>
              </div>
              <div className="flex items-center gap-x-2">
                <Button onClick={() => onUpdateQuantity(item.produkId, item.kuantitas - 1)} disabled={item.kuantitas <= 1} className="w-7 h-7 bg-red-500">
                  <Minus className="h-4 w-4 text-white hover:text-gray-700 cursor-pointer" />
                </Button>
                <span className="mx-4">{item.kuantitas}</span>
                <Button onClick={() => onUpdateQuantity(item.produkId, item.kuantitas + 1)} className="w-7 h-7">
                  <Plus className="h-4 w-4 text-black hover:text-gray-700 cursor-pointer" />
                </Button>
                <Button onClick={() => onDeleteItem?.(item.produkId)} className="w-8 h-8 flex bg-red-500 items-center justify-center border-2 border-black hover:bg-black hover:text-white">
                  <Trash2 className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          ))}

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

            {/* Input untuk Uang Masuk */}
            <div className="flex flex-col">
              {/* Input untuk Uang Masuk */}
              <label className="block mb-2 font-bold">Uang Masuk:</label>
              <input
                type="number"
                value={amountReceived}
                onChange={(e) => setAmountReceived(Number(e.target.value))}
                onFocus={(e) => {
                  if (e.target.value === "0") {
                    e.target.value = ""; // Hapus nilai 0 ketika input mendapatkan fokus
                  }
                }}
                onBlur={(e) => {
                  if (e.target.value === "") {
                    setAmountReceived(0); // Kembalikan ke 0 jika input kosong saat kehilangan fokus
                  }
                }}
                placeholder="Masukkan jumlah uang masuk"
                className="p-2 border-2 border-black rounded w-full"
              />{" "}
            </div>

            {customerData && (
              <div className="bg-white border-2 border-black p-2 mt-2">
                <h3 className="font-bold text-lg">Informasi Pelanggan:</h3>
                <p>{customerData.nama}</p>
                {customerData.pelangganId ? <p className="text-green-600">Member</p> : <p className="text-blue-600">Guest</p>}
                {customerData.nomorTelepon && <p>No. Telp: {customerData.nomorTelepon}</p>}
              </div>
            )}
            {customerData?.pelangganId && (
              <div className="flex justify-between items-center">
                <span className="font-bold">Poin Member: {memberPoints}</span>
                {redeemedPoints > 0 ? (
                  <button onClick={handleCancelRedeemPoints} className="px-4 py-2 bg-red-500 text-white font-bold border-2 border-black hover:bg-white hover:text-red-500 transition-colors">
                    Batal Tukar Poin
                  </button>
                ) : (
                  <button
                    onClick={handleRedeemPoints}
                    disabled={memberPoints === 0}
                    className="px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tukar Poin
                  </button>
                )}
              </div>
            )}
            <Button onClick={handlePlaceOrder} className="w-full" disabled={isLoading}>
              {isLoading ? "Memproses..." : "Buat Pesanan & Bayar"}
            </Button>
            {!showCustomerInput && (
              <Button onClick={() => setShowCustomerInput(true)} className="w-full">
                {customerData ? "Ubah Data Pelanggan" : "Pilih Member"}
              </Button>
            )}
            {showCustomerInput && <NeoCustomerInput onSubmit={handleCustomerSubmit} onCancel={() => setShowCustomerInput(false)} />}
          </div>
        </>
      )}
    </div>
  );
});

NeoOrderSummary.displayName = "NeoOrderSummary";
