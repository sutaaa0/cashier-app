"use client";

import { useState, useRef, JSX, useEffect } from "react";
import { Header } from "@/components/header";
import { CategoryNav } from "@/components/category-nav";
import { ProductGrid } from "@/components/product-grid";
import { toast } from "@/hooks/use-toast";
import { createOrder, getCurrentUser, getProducts } from "@/server/actions";
import { Produk as PrismaProduk, Penjualan, DetailPenjualan, Promotion } from "@prisma/client";
import { NeoSearchInput } from "./InputSearch";
import { NeoOrderSummary } from "./order-summary";
import { NeoProgressIndicator } from "./NeoProgresIndicator";
import { ReceiptModal } from "./ReceiptModal";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface Produk extends PrismaProduk {
  kategori: { nama: string; kategoriId: number };
  image: string;
  promotionProducts?: {
    id: number;
    produkId?: number;
    promotionId: number;
    activeUntil: Date | null;
    promotion: Promotion;
  }[];
}

interface DetailPenjualanWithProduk extends DetailPenjualan {
  produk: Produk;
}

interface PenjualanWithDetails extends Penjualan {
  detailPenjualan: DetailPenjualanWithProduk[];
  // Tambahkan properti untuk diskon
  promotionDiscounts?: { [produkId: number]: number };
  totalBeforePromotionDiscount?: number;
  totalAfterPromotionDiscount?: number;
}

interface ReceiptModalData {
  PenjualanId: number | undefined;
  finalTotal: number;
  amountReceived: number;
  change: number;
  customerId: number | null;
  petugasId: number;
  customerName: string;
  orderItems: {
    nama: string;
    kuantitas: number;
    subtotal: number;
    hargaNormal?: number;
    hargaSetelahDiskon?: number;
    discountAmount?: number;
    discountPercentage?: number;
    promotionDetails?: string;
  }[];
  transactionDate: Date;
  redeemedPoints?: number;
  totalBeforePointsDiscount?: number;
  totalPromotionDiscount?: number; // Total diskon dari promosi
}

interface OrderPayload extends Penjualan {
  pelangganId: number | null;
  guestId: number | null;
  redeemedPoints?: number;
  uangMasuk: number | null;
  kembalian: number | null;
  customerName?: string;
  // Tambahkan properti untuk diskon
  promotionDiscounts?: { [produkId: number]: number };
  totalBeforePromotionDiscount?: number;
  totalAfterPromotionDiscount?: number;
  detailPenjualan: {
    produkId: number;
    kuantitas: number;
    subtotal: number;
  }[];
}

interface OrderSummaryRef {
  resetCustomerData: () => void;
}

const Pos = (): JSX.Element => {
  const [selectedCategory, setSelectedCategory] = useState<string>("All Menu");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const router = useRouter();
  const [receiptModalData, setReceiptModalData] = useState<ReceiptModalData | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  const initialOrder: PenjualanWithDetails = {
    penjualanId: 0,
    tanggalPenjualan: new Date(),
    total_harga: 0,
    pelangganId: null,
    guestId: null,
    userId: 0,
    uangMasuk: 0,
    kembalian: 0,
    detailPenjualan: [],
    keuntungan: 0,
    total_modal: 0,
    diskonPoin: 0,
    promotionDiscounts: {},
    totalAfterPromotionDiscount: 0,
    totalBeforePromotionDiscount: 0,
  };

  const [order, setOrder] = useState<PenjualanWithDetails>(initialOrder);
  const orderSummaryRef = useRef<OrderSummaryRef | null>(null);

  // Use TanStack Query for fetching products
  const {
    data: products = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["products", selectedCategory],
    queryFn: () => getProducts(selectedCategory),
    refetchInterval: 10000,
    staleTime: 10000,
    retry: 3,
    enabled: !isAuthChecking, // Hanya aktifkan query setelah autentikasi selesai
  });

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const currentUser = await getCurrentUser();

        // Jika tidak ada response atau user tidak terautentikasi
        if (!currentUser) {
          router.push("/login");
          return;
        }

        // Validasi level pengguna
        switch (currentUser.level) {
          case "ADMIN":
            router.push("/dashboard-admin");
            return;
          case "PETUGAS":
            // Pengguna PETUGAS diizinkan mengakses halaman ini
            setIsAuthChecking(false);
            break;
          default:
            // Redirect user selain ADMIN/PETUGAS
            router.push("/login");
            return;
        }
      } catch (error) {
        console.error("Authentication error:", error);
        // Redirect ke login jika terjadi error
        router.push("/login");
      }
    };

    checkAuthentication();
  }, [router]);

  // Show error toast if query fails
  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to retrieve product data",
        variant: "destructive",
      });
    }
  }, [error]);

  const getPromotionDetails = (item: DetailPenjualanWithProduk): string | null => {
    if (!item.produk.promotionProducts || item.produk.promotionProducts.length === 0) return null;

    const now = new Date();
    const currentDay = now.getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;
    let highestDiscount = 0;
    let bestPromo: Promotion | null = null;

    item.produk.promotionProducts.forEach((pp) => {
      const promo = pp.promotion;
      const isActive = now >= new Date(promo.startDate) && now <= new Date(promo.endDate) && (!pp.activeUntil || now <= new Date(pp.activeUntil));
      if (!isActive) return;
      let applies = false;
      switch (promo.type) {
        case "QUANTITY_BASED":
          applies = promo.minQuantity ? item.kuantitas >= promo.minQuantity : false;
          break;
        case "WEEKEND":
          applies = isWeekend;
          break;
        case "FLASH_SALE":
        case "SPECIAL_DAY":
        case "PRODUCT_SPECIFIC":
          applies = true;
          break;
        default:
          applies = false;
      }
      if (!applies) return;
      let discountAmount = 0;
      if (promo.discountPercentage) {
        discountAmount = (item.subtotal * promo.discountPercentage) / 100;
      } else if (promo.discountAmount) {
        discountAmount = promo.discountAmount;
      }
      if (discountAmount > highestDiscount) {
        highestDiscount = discountAmount;
        bestPromo = promo;
      }
    });

    if (!bestPromo) return null;
    const finalPromo: Promotion = bestPromo;

    // Format detail promosi berdasarkan tipe
    if (finalPromo.type === "QUANTITY_BASED") {
      if (finalPromo.discountPercentage) {
        return `${finalPromo.discountPercentage}% off min. ${finalPromo.minQuantity} pcs`;
      } else if (finalPromo.discountAmount) {
        return `Rp${finalPromo.discountAmount} off min. ${finalPromo.minQuantity} pcs`;
      }
    } else if (finalPromo.type === "WEEKEND") {
      if (finalPromo.discountPercentage) {
        return `Weekend: ${finalPromo.discountPercentage}% off`;
      } else if (finalPromo.discountAmount) {
        return `Weekend: Rp${finalPromo.discountAmount} off`;
      }
    } else if (finalPromo.type === "FLASH_SALE") {
      if (finalPromo.discountPercentage) {
        return `Flash Sale: ${finalPromo.discountPercentage}% off`;
      } else if (finalPromo.discountAmount) {
        return `Flash Sale: Rp${finalPromo.discountAmount} off`;
      }
    } else if (finalPromo.type === "SPECIAL_DAY") {
      if (finalPromo.discountPercentage) {
        return `Special Offer: ${finalPromo.discountPercentage}% off`;
      } else if (finalPromo.discountAmount) {
        return `Special Offer: Rp${finalPromo.discountAmount} off`;
      }
    } else if (finalPromo.type === "PRODUCT_SPECIFIC") {
      if (finalPromo.discountPercentage) {
        return `${finalPromo.title || "Promo"}: ${finalPromo.discountPercentage}% off`;
      } else if (finalPromo.discountAmount) {
        return `${finalPromo.title || "Promo"}: Rp${finalPromo.discountAmount} off`;
      }
    }
    return null;
  };

  const addToOrder = (product: Produk): void => {
    console.log("Adding product to order:", product);
    setOrder((prev) => {
      console.log(" Previous order:", prev);
      const existingItem = prev.detailPenjualan.find((item) => item.produkId === product.produkId);

      let newDetailPenjualan: DetailPenjualanWithProduk[];
      if (existingItem) {
        newDetailPenjualan = prev.detailPenjualan.map((item) =>
          item.produkId === product.produkId
            ? {
                ...item,
                kuantitas: item.kuantitas + 1,
                subtotal: (item.kuantitas + 1) * product.harga,
              }
            : item
        );
      } else {
        newDetailPenjualan = [
          ...prev.detailPenjualan,
          {
            detailId: 0,
            penjualanId: prev.penjualanId,
            produkId: product.produkId,
            kuantitas: 1,
            subtotal: product.harga,
            produk: product,
            discountAmount: product.promotionProducts?.map((pp) => pp.promotion.discountAmount)[0] || 0,
            discountPercentage: product.promotionProducts?.map((pp) => pp.promotion.discountPercentage)[0] || 0,
            promotionId: product.promotionProducts?.map((pp) => pp.promotionId)[0] || 0,
            promotionTitle: product.promotionProducts?.map((pp) => pp.promotion.title)[0] || null,
          },
        ];
      }

      // Calculate total_harga and total_modal
      const total_harga = newDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
      const total_modal = newDetailPenjualan.reduce((sum, item) => sum + item.produk.hargaModal * item.kuantitas, 0);
      const keuntungan = total_harga - total_modal;

      return {
        ...prev,
        detailPenjualan: newDetailPenjualan,
        total_harga,
        total_modal,
        keuntungan,
      };
    });
  };

  const handleUpdateQuantity = (produkId: number, newQuantity: number): void => {
    setOrder((prevOrder) => {
      const updatedDetailPenjualan = prevOrder.detailPenjualan.map((item) => {
        if (item.produkId === produkId) {
          return {
            ...item,
            kuantitas: newQuantity,
            subtotal: newQuantity * item.produk.harga,
          };
        }
        return item;
      });

      // Recalculate totals
      const total_harga = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
      const total_modal = updatedDetailPenjualan.reduce((sum, item) => sum + item.produk.hargaModal * item.kuantitas, 0);
      const keuntungan = total_harga - total_modal;

      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga,
        total_modal,
        keuntungan,
      };
    });
  };

  const handleDeleteItem = (produkId: number): void => {
    setOrder((prevOrder) => {
      const updatedDetailPenjualan = prevOrder.detailPenjualan.filter((item) => item.produkId !== produkId);

      // Recalculate totals
      const total_harga = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);
      const total_modal = updatedDetailPenjualan.reduce((sum, item) => sum + item.produk.hargaModal * item.kuantitas, 0);
      const keuntungan = total_harga - total_modal;

      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga,
        total_modal,
        keuntungan,
      };
    });
  };

  const handlePlaceOrder = async (
    orderData: PenjualanWithDetails & {
      redeemedPoints?: number;
      uangMasuk?: number;
      kembalian?: number;
      customerName?: string;
      promotionDiscounts?: { [produkId: number]: number };
      totalBeforePromotionDiscount?: number;
      totalAfterPromotionDiscount?: number;
    }
  ): Promise<void> => {
    if (orderData.detailPenjualan.length === 0) {
      toast({
        title: "Error",
        description: "Please add products first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Make sure to include the total_modal and keuntungan in the order payload
      const orderPayload: OrderPayload = {
        ...orderData,
        pelangganId: orderData.pelangganId ?? null,
        guestId: orderData.guestId ?? null,
        total_harga: orderData.total_harga,
        total_modal: orderData.total_modal,
        keuntungan: orderData.keuntungan,
        redeemedPoints: orderData.redeemedPoints || 0,
        userId: orderData.userId,
        detailPenjualan: orderData.detailPenjualan.map((item) => ({
          produkId: item.produkId,
          kuantitas: item.kuantitas,
          subtotal: item.subtotal,
        })),
      };

      const penjualan = await createOrder(orderPayload);

      if (penjualan && "total_harga" in penjualan) {
        // Hitung total diskon promosi
        const totalPromotionDiscount = orderData.promotionDiscounts ? Object.values(orderData.promotionDiscounts).reduce((sum, discount) => sum + discount, 0) : 0;

        const modalData: ReceiptModalData = {
          finalTotal: penjualan.total_harga,
          amountReceived: orderData.uangMasuk || 0,
          change: orderData.kembalian || 0,
          customerId: orderData.pelangganId,
          PenjualanId: penjualan.PenjualanId,
          petugasId: orderData.userId,
          customerName: orderData.customerName || "Guest",
          orderItems: orderData.detailPenjualan.map((item) => {
            const hargaNormal = item.produk.harga;

            // Gunakan diskon dari promotionDiscounts jika ada
            const discountAmount = orderData.promotionDiscounts?.[item.produkId] || 0;

            // Hitung harga per unit setelah diskon
            const hargaSetelahDiskon = discountAmount > 0 ? hargaNormal - discountAmount / item.kuantitas : hargaNormal;

            // Hitung persentase diskon jika ada
            const discountPercentage = discountAmount > 0 ? (discountAmount / (hargaNormal * item.kuantitas)) * 100 : 0;

            return {
              nama: item.produk.nama,
              kuantitas: item.kuantitas,
              subtotal: item.subtotal,
              hargaNormal: hargaNormal,
              hargaSetelahDiskon: hargaSetelahDiskon,
              discountAmount: discountAmount,
              discountPercentage: discountPercentage,
              promotionDetails: getPromotionDetails(item) || undefined,
            };
          }),
          transactionDate: new Date(),
          redeemedPoints: orderData.redeemedPoints || 0,
          totalBeforePointsDiscount: orderData.totalAfterPromotionDiscount || orderData.total_harga,
          totalPromotionDiscount: totalPromotionDiscount,
        };

        setReceiptModalData(modalData);
        setShowReceiptModal(true);

        setOrder({
          penjualanId: 0,
          tanggalPenjualan: new Date(),
          total_harga: 0,
          pelangganId: null,
          guestId: null,
          userId: orderData.userId,
          detailPenjualan: [],
          uangMasuk: 0,
          kembalian: 0,
          keuntungan: 0,
          total_modal: 0,
          diskonPoin: 0,
          promotionDiscounts: {},
          totalAfterPromotionDiscount: 0,
          totalBeforePromotionDiscount: 0,
        });
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = (query: string): void => {
    setSearchQuery(query);
  };

  // Tampilkan loading saat pemeriksaan autentikasi
  if (isAuthChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <NeoProgressIndicator isLoading={true} message={"Checking authentication..."} />
        </div>
      </div>
    );
  }

  const filteredProducts = products.filter((product) => 
    (product?.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) && 
    (selectedCategory === "All Menu" || product?.kategori?.nama === selectedCategory)
  );

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} />
          <NeoSearchInput onSearch={handleSearch} />
          <div className="flex-1 overflow-auto">{isLoading ? <NeoProgressIndicator isLoading={isLoading} /> : <ProductGrid isLoading={isLoading} products={filteredProducts} onProductSelect={addToOrder} />}</div>
        </div>
        <NeoOrderSummary ref={orderSummaryRef} order={order} onUpdateQuantity={handleUpdateQuantity} onDeleteItem={handleDeleteItem} onPlaceOrder={handlePlaceOrder} onEditItem={() => {}} isLoading={isLoading} />
      </div>

      {showReceiptModal && receiptModalData && (
        <ReceiptModal
          receiptData={receiptModalData}
          onClose={() => {
            setShowReceiptModal(false);
            if (orderSummaryRef.current) {
              orderSummaryRef.current.resetCustomerData();
            }
          }}
        />
      )}

      {/* Refund Button */}
      <div className="fixed bottom-4 right-4">
        <Button onClick={() => router.push("/kasir/return")} className="mb-3 px-4 py-2 bg-red-500 text-white font-bold border-2 border-black hover:bg-black hover:text-red-500">
          Refund
        </Button>
      </div>
    </div>
  );
};

export default Pos;