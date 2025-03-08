"use client";

import { useState, forwardRef, useImperativeHandle, useCallback, useEffect } from "react";
import Image from "next/image";
import { Minus, Plus, Trash2, Tag } from "lucide-react";
import type { Penjualan, DetailPenjualan, Promotion } from "@prisma/client";
import { CustomerInputForm } from "./CustomerInput";
import { toast } from "@/hooks/use-toast";
import { getCurrentUser, getMemberPoints, redeemPoints } from "@/server/actions";
import { Button } from "./ui/button";

interface Produk {
  produkId: number;
  nama: string;
  harga: number;
  hargaModal: number;
  stok: number;
  minimumStok: number;
  statusStok: string;
  isDeleted: boolean;
  image: string;
  kategoriId: number;
  createdAt: Date;
  updatedAt: Date;
  kategori: { nama: string; kategoriId: number };
  promotionProducts?: { id: number; promotionId: number; activeUntil: Date | null; promotion: Promotion }[];
}

interface OrderSummaryProps {
  order: Penjualan & { detailPenjualan: (DetailPenjualan & { produk: Produk })[] };
  onUpdateQuantity: (produkId: number, quantity: number) => void;
  onEditItem: (item: DetailPenjualan & { produk: Produk }) => void;
  onDeleteItem: (produkId: number) => void;
  onPlaceOrder: (
    orderData: Penjualan & {
      redeemedPoints?: number;
      uangMasuk?: number;
      kembalian?: number;
      customerName?: string;
      detailPenjualan: (DetailPenjualan & { produk: Produk })[];
      promotionDiscounts: {
        [produkId: number]: number;
      };
      totalBeforePromotionDiscount: number;
      totalAfterPromotionDiscount: number;
    }
  ) => Promise<void>;
  isLoading: boolean;
}

export const NeoOrderSummary = forwardRef<{ resetCustomerData: () => void }, OrderSummaryProps>(({ order, onUpdateQuantity, onDeleteItem, onPlaceOrder, isLoading }, ref) => {
  // State untuk data pelanggan
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);
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
  const [formattedAmount, setFormattedAmount] = useState<string>("");

  // State untuk menyimpan diskon promosi
  const [promotionDiscounts, setPromotionDiscounts] = useState<{ [produkId: number]: number }>({});
  const [totalDiscount, setTotalDiscount] = useState(0);

  const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace(/\s/g, "");
  };

  // Parse string Rupiah ke number
  const parseRupiah = (value: string): number => {
    return Number(value.replace(/[^\d]/g, ""));
  };

  // Handle perubahan input uang masuk
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Hapus semua karakter non-digit
    const numericValue = parseRupiah(inputValue);

    // Update nilai actual dan format
    setAmountReceived(numericValue);
    setFormattedAmount(formatRupiah(numericValue));
  };

  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser({ id: currentUser.id, name: currentUser.username });
      }
    };
    fetchUser();
  }, []);

  // Replace the existing useEffect with this updated version to handle all promotion types
  useEffect(() => {
    const calculateAllPromotionDiscounts = () => {
      const newPromotionDiscounts: { [produkId: number]: number } = {};
      let newTotalDiscount = 0;

      // Get current date for promotion validation
      const now = new Date();
      const currentDay = now.getDay(); // 0-6, where 0 is Sunday
      const isWeekend = currentDay === 0 || currentDay === 6; // Check if it's weekend (Saturday or Sunday)

      order.detailPenjualan.forEach((item) => {
        const produk = item.produk;

        // Check if product has promotions
        if (produk.promotionProducts && produk.promotionProducts.length > 0) {
          // Filter active promotions (regardless of type)
          const activePromotions = produk.promotionProducts.filter((pp) => {
            const promo = pp.promotion;

            return now >= new Date(promo.startDate) && now <= new Date(promo.endDate) && (pp.activeUntil ? now <= new Date(pp.activeUntil) : true);
          });

          // Process each active promotion
          let highestDiscount = 0;

          activePromotions.forEach((pp) => {
            const promo = pp.promotion;
            let discountAmount = 0;

            // Calculate discount based on promotion type
            switch (promo.type) {
              case "QUANTITY_BASED":
                // Apply only if quantity meets the minimum requirement
                if (promo.minQuantity && item.kuantitas >= promo.minQuantity) {
                  if (promo.discountPercentage) {
                    discountAmount = (item.subtotal * promo.discountPercentage) / 100;
                  } else if (promo.discountAmount) {
                    discountAmount = promo.discountAmount;
                  }
                }
                break;

              case "FLASH_SALE":
                // Flash sale typically applies to all purchases of this product
                if (promo.discountPercentage) {
                  discountAmount = (item.subtotal * promo.discountPercentage) / 100;
                } else if (promo.discountAmount) {
                  discountAmount = promo.discountAmount;
                }
                break;

              case "SPECIAL_DAY":
                // Special day promotions apply on specific dates
                if (promo.discountPercentage) {
                  discountAmount = (item.subtotal * promo.discountPercentage) / 100;
                } else if (promo.discountAmount) {
                  discountAmount = promo.discountAmount;
                }
                break;

              case "WEEKEND":
                // Weekend promotions apply only on weekends
                if (isWeekend) {
                  if (promo.discountPercentage) {
                    discountAmount = (item.subtotal * promo.discountPercentage) / 100;
                  } else if (promo.discountAmount) {
                    discountAmount = promo.discountAmount;
                  }
                }
                break;

              case "PRODUCT_SPECIFIC":
                // Product specific promotions always apply to the specific product
                if (promo.discountPercentage) {
                  discountAmount = (item.subtotal * promo.discountPercentage) / 100;
                } else if (promo.discountAmount) {
                  discountAmount = promo.discountAmount;
                }
                break;
            }

            // Keep track of the highest discount for this product
            if (discountAmount > highestDiscount) {
              highestDiscount = discountAmount;
            }
          });

          // Apply the highest discount found for this product
          if (highestDiscount > 0) {
            newPromotionDiscounts[item.produkId] = highestDiscount;
            newTotalDiscount += highestDiscount;
          }
        }
      });

      setPromotionDiscounts(newPromotionDiscounts);
      setTotalDiscount(newTotalDiscount);
    };

    calculateAllPromotionDiscounts();
  }, [order.detailPenjualan]);

  useImperativeHandle(ref, () => ({
    resetCustomerData: () => {
      setCustomerData(null);
      setShowCustomerInput(false);
      setMemberPoints(0);
      setRedeemedPoints(0);
      setAmountReceived(0);
      setFormattedAmount("");
      setPromotionDiscounts({});
      setTotalDiscount(0);
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

    // Hitung total setelah diskon promosi dan diskon poin
    const totalAfterPromotions = order.total_harga - totalDiscount;
    const finalTotal = Math.max(totalAfterPromotions - redeemedPoints, 0);

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

    // Calculate adjusted profit after promotions and points redemption
    const adjustedKeuntungan = order.keuntungan ? order.keuntungan - totalDiscount - redeemedPoints : 0;

    // Panggil fungsi onPlaceOrder dengan mengirim data order lengkap
    onPlaceOrder({
      ...order,
      total_harga: finalTotal,
      total_modal: order.total_modal,
      keuntungan: adjustedKeuntungan,
      pelangganId: customerData?.pelangganId ?? null,
      guestId: customerData?.guestId ?? null,
      redeemedPoints: redeemedPoints, // Ini akan dipetakan ke diskonPoin di server
      userId: user.id,
      uangMasuk: amountReceived,
      kembalian: change,
      customerName: customerData?.nama || "Guest",
      promotionDiscounts: promotionDiscounts,
      totalBeforePromotionDiscount: order.total_harga,
      totalAfterPromotionDiscount: totalAfterPromotions,
    });
  };

  const handleRedeemPoints = useCallback(async () => {
    if (customerData?.pelangganId) {
      try {
        const points = await getMemberPoints(customerData.pelangganId);
        if (points > 0) {
          // Gunakan poin yang dimasukkan pengguna atau semua poin jika pointsToRedeem = 0
          const pointsToUse = pointsToRedeem > 0 ? pointsToRedeem : points;

          // Pastikan tidak melebihi total transaksi
          const maxRedeemable = Math.min(pointsToUse, order.total_harga - totalDiscount);

          if (maxRedeemable < 1000) {
            toast({
              title: "Error",
              description: "Minimal redeem poin adalah 1000 poin",
              variant: "destructive",
            });
            return;
          }

          const redeemed = await redeemPoints(customerData.pelangganId, maxRedeemable, order.total_harga - totalDiscount);
          setRedeemedPoints(redeemed);
          setMemberPoints(points - redeemed);
          setPointsToRedeem(0); // Reset input setelah redeem
          toast({
            title: "Berhasil",
            description: `${redeemed} poin berhasil ditukarkan`,
          });
        } else {
          toast({
            title: "Error",
            description: "Poin tidak mencukupi",
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
  }, [customerData, order.total_harga, totalDiscount, pointsToRedeem]);

  const handleCancelRedeemPoints = useCallback(() => {
    setRedeemedPoints(0);
    setMemberPoints((prevPoints) => prevPoints + redeemedPoints);
    toast({
      title: "Berhasil",
      description: "Penukaran poin dibatalkan",
    });
  }, [redeemedPoints]);

  // Calculate profit margins for display
  const calculateProfitPercentage = () => {
    const totalAfterDiscount = order.total_harga - totalDiscount;
    if (!totalAfterDiscount || !order.total_modal || totalAfterDiscount === 0) return 0;
    const adjustedProfit = (order.keuntungan || 0) - totalDiscount;
    return ((adjustedProfit / totalAfterDiscount) * 100).toFixed(1);
  };

  // Replace the existing hasQuantityPromotion function with this more general function
  const hasActivePromotion = (item: DetailPenjualan & { produk: Produk }) => {
    if (!item.produk.promotionProducts || item.produk.promotionProducts.length === 0) {
      return false;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;

    return item.produk.promotionProducts.some((pp) => {
      const promo = pp.promotion;

      // Check if promotion is active based on dates
      const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate) && (pp.activeUntil ? now <= new Date(pp.activeUntil) : true);

      if (!isActive) return false;

      // Check based on promotion type
      switch (promo.type) {
        case "QUANTITY_BASED":
          return promo.minQuantity && item.kuantitas >= promo.minQuantity;
        case "WEEKEND":
          return isWeekend;
        case "FLASH_SALE":
        case "SPECIAL_DAY":
        case "PRODUCT_SPECIFIC":
          return true; // These are always active if date conditions are met
        default:
          return false;
      }
    });
  };

  // Replace the existing getPromotionDetails function with this enhanced version
  const getPromotionDetails = (item: DetailPenjualan & { produk: Produk }) => {
    if (!item.produk.promotionProducts || item.produk.promotionProducts.length === 0) {
      return null;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;

    // Find the active promotion with the highest discount
    let highestDiscount = 0;
    let bestPromo = null as Promotion | null;

    item.produk.promotionProducts.forEach((pp) => {
      const promo = pp.promotion;

      // Check if promotion is active based on dates
      const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate) && (pp.activeUntil ? now <= new Date(pp.activeUntil) : true);

      if (!isActive) return;

      // Check if promotion applies based on type
      let applies = false;

      switch (promo.type) {
        case "QUANTITY_BASED":
          applies = typeof promo.minQuantity === "number" && item.kuantitas >= promo.minQuantity;
          break;
        case "WEEKEND":
          applies = isWeekend;
          break;
        case "FLASH_SALE":
        case "SPECIAL_DAY":
        case "PRODUCT_SPECIFIC":
          applies = true; // These are always active if date conditions are met
          break;
        default:
          applies = false;
      }

      if (!applies) return;

      // Calculate discount amount
      let discountAmount = 0;
      if (promo.discountPercentage) {
        discountAmount = (item.subtotal * promo.discountPercentage) / 100;
      } else if (promo.discountAmount) {
        discountAmount = promo.discountAmount;
      }

      // Update best promotion if this one gives a higher discount
      if (discountAmount > highestDiscount) {
        highestDiscount = discountAmount;
        bestPromo = promo;
      }
    });

    if (!bestPromo) return null;

    // Format the promotion details based on type
    switch (bestPromo.type) {
      case "QUANTITY_BASED":
        if (bestPromo.discountPercentage) {
          return `${bestPromo.discountPercentage}% off min. ${bestPromo.minQuantity} pcs`;
        } else if (bestPromo.discountAmount) {
          return `${formatTotal(bestPromo.discountAmount)} off min. ${bestPromo.minQuantity} pcs`;
        }
        break;

      case "WEEKEND":
        if (bestPromo.discountPercentage) {
          return `Weekend: ${bestPromo.discountPercentage}% off`;
        } else if (bestPromo.discountAmount) {
          return `Weekend: ${formatTotal(bestPromo.discountAmount)} off`;
        }
        break;

      case "FLASH_SALE":
        if (bestPromo.discountPercentage) {
          return `Flash Sale: ${bestPromo.discountPercentage}% off`;
        } else if (bestPromo.discountAmount) {
          return `Flash Sale: ${formatTotal(bestPromo.discountAmount)} off`;
        }
        break;

      case "SPECIAL_DAY":
        if (bestPromo.discountPercentage) {
          return `Special Offer: ${bestPromo.discountPercentage}% off`;
        } else if (bestPromo.discountAmount) {
          return `Special Offer: ${formatTotal(bestPromo.discountAmount)} off`;
        }
        break;

      case "PRODUCT_SPECIFIC":
        if (bestPromo.discountPercentage) {
          return `${bestPromo.title}: ${bestPromo.discountPercentage}% off`;
        } else if (bestPromo.discountAmount) {
          return `${bestPromo.title}: ${formatTotal(bestPromo.discountAmount)} off`;
        }
        break;
    }

    return bestPromo.title || "Discount";
  };

  return (
    <div className="p-4 border-4 border-black w-[500px] flex flex-col h-[calc(100vh-100px)] bg-[#e8f1fe] font-mono overflow-y-scroll">
      {order.detailPenjualan.map((item) => (
        <div key={item.produkId} className="flex items-center justify-between py-2 border-b border-gray-200">
          <div className="flex items-center">
            <div className="group cursor-pointer bg-white border-2 border-black p-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 active:shadow-none active:translate-y-0.5">
              <div className="relative w-16 h-16 border-2 border-black">
                <Image src={item.produk.image || "/placeholder.svg"} alt={item.produk.nama} fill className="object-cover" />
              </div>
            </div>
            <div className="ml-4">
              <p className="text-lg font-medium">{item.produk.nama}</p>
              <p className="text-sm text-gray-500">
                {formatTotal(item.subtotal)}
                {promotionDiscounts[item.produkId] && <span className="text-red-500 ml-2">(-{formatTotal(promotionDiscounts[item.produkId])})</span>}
              </p>
              {hasActivePromotion(item) && (
                <div className="flex items-center mt-1">
                  <Tag className="h-3 w-3 text-red-500 mr-1" />
                  <p className="text-xs text-red-500">{getPromotionDetails(item)}</p>
                </div>
              )}
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

        {totalDiscount > 0 && (
          <div className="flex justify-between text-red-600 font-bold">
            <span>Diskon Promosi</span>
            <span>-{formatTotal(totalDiscount)}</span>
          </div>
        )}

        {order.total_modal !== null && order.total_modal > 0 && (
          <div className="flex justify-between text-black">
            <span>Modal</span>
            <span>{formatTotal(order.total_modal)}</span>
          </div>
        )}

        {order.keuntungan !== null && order.keuntungan > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Keuntungan</span>
            <span>
              {formatTotal(order.keuntungan - totalDiscount)} ({calculateProfitPercentage()}%)
            </span>
          </div>
        )}

        {redeemedPoints > 0 && (
          <div className="flex justify-between text-green-600 font-bold">
            <span>Potongan Poin</span>
            <span>-{formatTotal(redeemedPoints)}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-xl">
          <span>TOTAL</span>
          <span>{formatTotal(order.total_harga - totalDiscount - redeemedPoints)}</span>
        </div>

        {/* Input untuk Uang Masuk */}
        <div className="flex flex-col">
          <label className="block mb-2 font-bold">Uang Masuk:</label>
          <input
            type="text"
            value={formattedAmount}
            onChange={handleAmountChange}
            onFocus={(e) => {
              if (parseRupiah(e.target.value) === 0) {
                setFormattedAmount("");
              }
            }}
            onBlur={(e) => {
              if (e.target.value === "") {
                setAmountReceived(0);
                setFormattedAmount("");
              }
            }}
            placeholder="Masukkan jumlah uang masuk"
            className="p-2 border-2 border-black rounded w-full"
          />
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
          <div className="bg-white border-2 border-black p-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-bold">Poin Member: {memberPoints}</span>
              <span className="text-sm text-gray-500">1 poin = Rp 1</span>
            </div>

            {redeemedPoints > 0 ? (
              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span>Poin Ditukarkan:</span>
                  <span className="font-bold text-green-600">{redeemedPoints} poin</span>
                </div>
                <button onClick={handleCancelRedeemPoints} className="w-full px-4 py-2 bg-red-500 text-white font-bold border-2 border-black hover:bg-white hover:text-red-500 transition-colors">
                  Batal Tukar Poin
                </button>
              </div>
            ) : (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    value={pointsToRedeem || ""}
                    onChange={(e) => setPointsToRedeem(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="Jumlah poin untuk ditukar"
                    className="p-2 border-2 border-black rounded w-full"
                  />
                  <button onClick={() => setPointsToRedeem(memberPoints)} className="whitespace-nowrap px-2 py-2 bg-gray-200 text-black font-bold border-2 border-black hover:bg-white transition-colors">
                    Max
                  </button>
                </div>
                <button
                  onClick={handleRedeemPoints}
                  disabled={memberPoints < 1000}
                  className="w-full px-4 py-2 bg-black text-white font-bold border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Tukar Poin
                </button>
                <p className="text-xs text-gray-500 mt-1">Minimal 1000 poin untuk penukaran</p>
              </div>
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
        {showCustomerInput && <CustomerInputForm onSubmit={handleCustomerSubmit} onCancel={() => setShowCustomerInput(false)} />}
      </div>
    </div>
  );
});

NeoOrderSummary.displayName = "NeoOrderSummary";
