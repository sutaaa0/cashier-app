"use client"
import type { Produk, Promotion } from "@prisma/client"
import Image from "next/image"
import { formatRupiah } from "@/lib/formatIdr"
import { isAfter, isBefore, format } from "date-fns"
import { useEffect, useState, useRef, useMemo } from "react"
import { Clock, Flame, Calendar } from "lucide-react"

// Updated interfaces to match the database schema relationships
interface NeoProductCardProps {
  product: Produk & {
    image: string
    kategoriId: number
    kategori: {
      nama: string
      kategoriId: number
    }
    // Updated to include both types of promotion relationships
    promotionProducts?: {
      promotionId: number
      promotion: Promotion
      activeUntil?: Date | null
    }[]
  }
  // Use consistent interface in props
  onClick: (
    product: Produk & {
      image: string
      kategori: { nama: string; kategoriId: number }
      harga: number
    },
  ) => void
}

// State for promotion display
interface PromotionState {
  promotionId: number | null
  startDate: Date | null
  endDate: Date | null
  promotionType: string | null
  promotionTitle: string | null
}

// Key structure for promotion cache/tracking
interface PromotionKey {
  id: number
  startDate: Date
  endDate: Date
  type: string
  title: string | null
}

export function NeoProductCard({ product, onClick }: NeoProductCardProps) {
  // Create separate refs to store stable references to promotion data
  const promotionsRef = useRef<PromotionKey[]>([]);
  
  // State for promotion display
  const [promotionData, setPromotionData] = useState<PromotionState>({
    promotionId: null,
    startDate: null,
    endDate: null,
    promotionType: null,
    promotionTitle: null
  });
  
  // Add animation state for flash sales
  const [pulseEffect, setPulseEffect] = useState(false);
  
  // Track if component is mounted to prevent memory leaks
  const isMounted = useRef(true);

  // Use memo to calculate all promotions and filter active ones
  // This ensures we only recalculate when product.promotionProducts changes
  const { activePromotions, totalDiscountPercentage, totalDiscountAmount, discountedPrice, quantityBasedPromotions } = useMemo(() => {
    // Get all relevant promotions from product relationship
    const allPromos = product.promotionProducts?.map((pp) => pp.promotion) || [];
    
    // Current date for checking if promotion is active
    const today = new Date();
    
    // Filter active promotions applicable to single items
    const activePromos = allPromos.filter((promo) => {
      // Check active date range
      const startDate = new Date(promo.startDate);
      const endDate = new Date(promo.endDate);
      const isActive = isAfter(today, startDate) && isBefore(today, endDate);
      
      // Skip quantity-based promotions in card view - these apply at checkout
      const isSingleItemApplicable = promo.type !== "QUANTITY_BASED";
      
      return isActive && isSingleItemApplicable;
    });
    
    // Calculate total discounts
    const discountPercentage = activePromos.reduce((acc, promo) => 
      acc + (promo.discountPercentage || 0), 0);
      
    const discountAmount = activePromos.reduce((acc, promo) => 
      acc + (promo.discountAmount || 0), 0);
    
    // Calculated discounted price
    const finalPrice = Math.max(
      product.harga * ((100 - discountPercentage) / 100) - discountAmount, 
      0
    );
    
    // Get all quantity-based promotions for info display
    const qtyPromos = allPromos.filter(promo => 
      isAfter(today, new Date(promo.startDate)) && 
      isBefore(today, new Date(promo.endDate)) && 
      promo.type === "QUANTITY_BASED"
    );
    
    return {
      activePromotions: activePromos,
      allPromotions: allPromos,
      totalDiscountPercentage: discountPercentage,
      totalDiscountAmount: discountAmount,
      discountedPrice: finalPrice,
      quantityBasedPromotions: qtyPromos
    };
  }, [product.promotionProducts]);
  
  // Function to format promotion date range
  const formatPromotionPeriod = (startDate: Date | null, endDate: Date | null) => {
    if (!startDate || !endDate) return "";
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Check if promotion is within the same day
    if (startDay.getTime() === endDay.getTime()) {
      return `Hari ini ${format(startDate, 'HH:mm')} - ${format(endDate, 'HH:mm')}`;
    }
    
    // Check if promotion spans multiple days
    return `${format(startDate, 'dd/MM')} - ${format(endDate, 'dd/MM')}`;
  };
  
  // Setup promotion display
  useEffect(() => {
    // Create a stable reference for each active promotion
    const promotionKeys: PromotionKey[] = activePromotions.map(promo => ({
      id: promo.promotionId,
      startDate: new Date(promo.startDate),
      endDate: new Date(promo.endDate),
      type: promo.type,
      title: promo.title
    }));
    
    // Sort promotions by end date (earliest ending first)
    promotionKeys.sort((a, b) => a.endDate.getTime() - b.endDate.getTime());
    
    // Update ref
    promotionsRef.current = promotionKeys;
    
    // Set first promotion for display
    if (promotionKeys.length > 0) {
      const firstPromo = promotionKeys[0];
      setPromotionData({
        promotionId: firstPromo.id,
        startDate: firstPromo.startDate,
        endDate: firstPromo.endDate,
        promotionType: firstPromo.type,
        promotionTitle: firstPromo.title
      });
      
      // Set pulse effect for FLASH_SALE
      if (firstPromo.type === "FLASH_SALE") {
        const pulseInterval = setInterval(() => {
          if (isMounted.current) {
            setPulseEffect(prev => !prev);
          }
        }, 1000);
        
        return () => {
          clearInterval(pulseInterval);
        };
      }
    } else {
      // Reset if no promotions
      setPromotionData({
        promotionId: null,
        startDate: null,
        endDate: null,
        promotionType: null,
        promotionTitle: null
      });
    }
  }, [activePromotions]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Check if product is out of stock
  const isOutOfStock = product.stok <= 0;

  // Fungsi helper untuk memformat informasi diskon
  const getDiscountInfo = () => {
    if (totalDiscountPercentage > 0 && totalDiscountAmount > 0) {
      return `Diskon ${totalDiscountPercentage}% + ${formatRupiah(totalDiscountAmount)}`
    } else if (totalDiscountPercentage > 0) {
      return `Diskon ${totalDiscountPercentage}%`
    } else if (totalDiscountAmount > 0) {
      return `Diskon ${formatRupiah(totalDiscountAmount)}`
    }
    return null
  };
  
  // Get promotional badge style based on type
  const getPromoBadgeStyle = (type: string | null) => {
    if (!type) return "bg-gray-600";
    
    switch (type) {
      case "FLASH_SALE":
        return "bg-red-600";
      case "SPECIAL_DAY":
        return "bg-orange-500";
      case "WEEKEND":
        return "bg-green-500";
      case "PRODUCT_SPECIFIC":
        return "bg-blue-600";
      default:
        return "bg-gray-600";
    }
  };
  
  // Get promotional icon based on type
  const getPromoIcon = (type: string | null) => {
    if (!type) return null;
    
    switch (type) {
      case "FLASH_SALE":
        return <Flame className={`w-4 h-4 text-white ${pulseEffect ? 'animate-pulse' : ''}`} />;
      case "SPECIAL_DAY":
      case "WEEKEND":
        return <Calendar className="w-4 h-4 text-white" />;
      default:
        return <Clock className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div
      onClick={() => !isOutOfStock && onClick({ ...product })}
      className={`group cursor-pointer bg-white border-2 border-black p-4 relative
                 ${isOutOfStock ? "relative cursor-not-allowed border-red-600 border-dashed bg-red-50" : "shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 active:shadow-none active:translate-y-0.5"}`}
    >
      {/* "SOLD OUT" label */}
      {isOutOfStock && (
        <div className="absolute -top-3 -right-3 rotate-12 z-10">
          <div className="bg-red-600 border-3 border-black text-white font-bold px-4 py-0.5 transform rotate-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-mono text-sm tracking-widest block transform -rotate-3">SOLD OUT</span>
          </div>
        </div>
      )}

      {/* "X" mark overlay for out of stock products */}
      {isOutOfStock && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="relative w-full h-full overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-red-600 border border-black transform rotate-45 origin-center"></div>
              <div className="w-full h-1 bg-red-600 border border-black transform -rotate-45 origin-center"></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Shopee-style discount badge (top left) */}
      {activePromotions.length > 0 && !isOutOfStock && totalDiscountPercentage > 0 && (
        <div className="absolute -top-3 -left-3 z-10">
          <div className="bg-red-600 border-2 border-black text-white font-bold px-3 py-2 transform -rotate-6 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="font-mono text-lg tracking-tight block transform rotate-0">
              {totalDiscountPercentage}%
            </span>
            <span className="text-xs tracking-tight transform rotate-0 block -mt-1">
              OFF
            </span>
          </div>
        </div>
      )}

      {/* Product Image */}
      <div
        className={`aspect-square relative mb-4 border-2 ${isOutOfStock ? "border-red-600" : "border-black"} overflow-hidden`}
      >
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.nama}
          width={300}
          height={300}
          priority
          className={`w-full h-full object-cover transition-transform duration-300 ${isOutOfStock ? "filter grayscale" : "group-hover:scale-110"}`}
        />

        {/* Out of stock label inside image */}
        {isOutOfStock && (
          <div className="absolute bottom-2 left-0 right-0 mx-auto w-4/5 text-center">
            <div className="bg-white border-2 border-black font-mono py-1 transform -rotate-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              <span className="text-lg font-bold tracking-tight inline-block transform rotate-0 text-red-600">
                HABIS
              </span>
            </div>
          </div>
        )}

        {/* Promotion period display */}
        {promotionData.promotionId && (
          <div className="absolute bottom-0 left-0 right-0 mx-auto w-full text-center">
            <div className={`${getPromoBadgeStyle(promotionData.promotionType)} border-t-2 border-l-2 border-r-2 border-black py-2 px-1`}>
              <div className="flex items-center justify-center gap-1">
                {getPromoIcon(promotionData.promotionType)}
                <span className="text-xs font-bold tracking-tight inline-block text-white">
                  {promotionData.promotionTitle || (promotionData.promotionType === "FLASH_SALE" ? "FLASH SALE" : "PROMO")}
                </span>
              </div>
              
              {/* Promotion Period Display */}
              <div className="mt-1 flex items-center justify-center">
                <div className="bg-black text-white px-1 py-0.5 border border-white font-mono text-xs font-bold">
                  {formatPromotionPeriod(promotionData.startDate, promotionData.endDate)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2 relative">
        {/* Product Name with strikethrough if out of stock */}
        <h3 className={`font-bold text-lg font-mono ${isOutOfStock ? "text-gray-600" : ""}`}>
          {product.nama}
          {isOutOfStock && (
            <span className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-600 transform -translate-y-1/2"></span>
          )}
        </h3>

        {/* Category & Price */}
        <div className="flex items-center justify-between">
          <span
            className={`px-2 py-1 ${isOutOfStock ? "bg-gray-500" : "bg-black"} text-white font-mono text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
          >
            {product.kategori.nama}
          </span>

          {/* Price display */}
          {activePromotions.length > 0 && !isOutOfStock ? (
            <div className="text-right">
              <span className="line-through text-gray-500 font-mono text-sm">{formatRupiah(product.harga)}</span>
              <span className="block font-bold font-mono text-red-600 text-lg">{formatRupiah(discountedPrice)}</span>
            </div>
          ) : (
            <div className="text-right">
              <span className={`font-bold font-mono text-sm ${isOutOfStock ? "text-gray-600 line-through" : ""}`}>
                {formatRupiah(product.harga)}
              </span>
              {isOutOfStock && <span className="block font-bold font-mono text-red-600 text-xs">TIDAK TERSEDIA</span>}
            </div>
          )}
        </div>

        {/* Tampilkan informasi diskon */}
        {activePromotions.length > 0 && !isOutOfStock && getDiscountInfo() && (
          <div className="mt-2">
            <span className="px-2 py-1 bg-red-600 text-white font-mono text-sm border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
              {getDiscountInfo()}
            </span>
          </div>
        )}

        {/* Discount Labels - Only show non-quantity based in the active section */}
        {activePromotions.length > 0 && !isOutOfStock && (
          <div className="flex flex-wrap gap-1 mt-2">
            {activePromotions.map((promo) => (
              <span
                key={promo.promotionId}
                className="px-2 py-1 text-xs font-bold font-mono uppercase text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                style={{
                  backgroundColor:
                    promo.type === "FLASH_SALE"
                      ? "#ff3b30"
                      : promo.type === "SPECIAL_DAY"
                        ? "#ff9500"
                        : promo.type === "WEEKEND"
                          ? "#4cd964"
                          : promo.type === "PRODUCT_SPECIFIC"
                            ? "#007aff"
                            : "#8e8e93",
                }}
              >
                {promo.type.replace("_", " ")}
              </span>
            ))}
          </div>
        )}

        {/* Display quantity-based promotions separately as info only */}
        {quantityBasedPromotions.length > 0 && !isOutOfStock && (
          <div className="mt-2 font-mono text-xs p-2 border border-dashed border-purple-500 bg-purple-50">
            {quantityBasedPromotions.map((promo) => (
              <div key={promo.promotionId} className="mb-1 last:mb-0">
                <span className="font-bold text-purple-700">Beli {promo.minQuantity}+ disc: </span>
                {promo.discountPercentage ? (
                  <span>{promo.discountPercentage}%</span>
                ) : promo.discountAmount ? (
                  <span>{formatRupiah(promo.discountAmount)}</span>
                ) : (
                  <span>Promo</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Out of stock info */}
        {isOutOfStock && (
          <div className="mt-3 font-mono text-sm">
            <div className="relative flex items-center justify-center py-2 px-3 overflow-hidden">
              <div className="absolute inset-0 bg-red-100 border-2 border-red-600 transform -rotate-1"></div>
              <div className="absolute inset-0 bg-white border-2 border-black rotate-1 opacity-60"></div>
              <div className="relative z-10 text-center">
                <p className="font-bold text-red-600 text-md tracking-tight">BARANG KOSONG</p>
                <p className="text-black text-xs">
                  produk sudah habis
                  <br />
                  silahkan pilih produk lain
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}