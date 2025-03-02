"use client";
import { Produk, Promotion } from "@prisma/client";
import Image from "next/image";
import { formatRupiah } from "@/lib/formatIdr";
import { isAfter, isBefore } from "date-fns";

// Updated interfaces to match the database schema relationships
interface NeoProductCardProps {
  product: Produk & { 
    image: string; 
    kategoriId: number;
    kategori: { 
      nama: string;
      kategoriId: number;
    }; 
    // Updated to include both types of promotion relationships
    promotionProducts?: {
      promotionId: number;
      promotion: Promotion;
    }[];
  };
  // Use consistent interface in props
  onClick: (product: Produk & { 
    image: string; 
    kategori: { nama: string }; 
    harga: number;
  }) => void;
}

export function NeoProductCard({ product, onClick }: NeoProductCardProps) {
  // Get all relevant promotions from product and category relationships
  const getAllPromotions = (): Promotion[] => {
    const productPromotions = product.promotionProducts?.map(pp => pp.promotion) || [];
    
    // We don't need to filter here since the database query should already
    // include only relevant category promotions
    return productPromotions;
  };

  // Fungsi untuk memeriksa apakah promosi aktif
  const isPromotionActive = (promo: Promotion): boolean => {
    const today = new Date();
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);

    // Check if current date is within the promotion range
    return isAfter(today, startDate) && isBefore(today, endDate);
  };

  // Filter promotions that can be applied to a single product view
  // Quantity-based promotions should not be applied in the card view
  const isPromotionApplicableToSingleItem = (promo: Promotion): boolean => {
    // If it's a quantity-based promotion, it should not be applied at the card level
    // These will be handled at the cart/checkout level
    return promo.type !== "QUANTITY_BASED";
  };

  // Get and filter all active promotions that are applicable to single items
  const allPromotions = getAllPromotions();
  const activePromotions = allPromotions.filter(promo => 
    isPromotionActive(promo) && isPromotionApplicableToSingleItem(promo)
  );

  // Calculate total discount from active promotions
  const totalDiscountPercentage = activePromotions.reduce(
    (acc, promo) => acc + (promo.discountPercentage || 0),
    0
  );
  const totalDiscountAmount = activePromotions.reduce(
    (acc, promo) => acc + (promo.discountAmount || 0),
    0
  );

  // Calculate discounted price
  const discountedPrice = Math.max(
    product.harga * ((100 - totalDiscountPercentage) / 100) - totalDiscountAmount,
    0
  );

  // Get quantity-based promotions (for display purposes only)
  const quantityBasedPromotions = allPromotions.filter(
    promo => isPromotionActive(promo) && promo.type === "QUANTITY_BASED"
  );

  // Check if product is out of stock
  const isOutOfStock = product.stok <= 0;

  return (
    <div
      onClick={() => !isOutOfStock && onClick({ ...product, harga: discountedPrice })}
      className={`group cursor-pointer bg-white border-2 border-black p-4 
                 ${isOutOfStock ? 'relative cursor-not-allowed border-red-600 border-dashed bg-red-50' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all duration-200 hover:-translate-y-0.5 active:shadow-none active:translate-y-0.5'}`}
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

      {/* Product Image */}
      <div className={`aspect-square relative mb-4 border-2 ${isOutOfStock ? 'border-red-600' : 'border-black'} overflow-hidden`}>
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.nama}
          width={300}
          height={300}
          priority
          className={`w-full h-full object-cover transition-transform duration-300 ${isOutOfStock ? 'filter grayscale' : 'group-hover:scale-110'}`}
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
      </div>

      <div className="space-y-2 relative">
        {/* Product Name with strikethrough if out of stock */}
        <h3 className={`font-bold text-lg font-mono ${isOutOfStock ? 'text-gray-600' : ''}`}>
          {product.nama}
          {isOutOfStock && (
            <span className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-600 transform -translate-y-1/2"></span>
          )}
        </h3>
        
        {/* Category & Price */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 ${isOutOfStock ? 'bg-gray-500' : 'bg-black'} text-white font-mono text-sm border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
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
              <span className={`font-bold font-mono text-sm ${isOutOfStock ? 'text-gray-600 line-through' : ''}`}>
                {formatRupiah(product.harga)}
              </span>
              {isOutOfStock && (
                <span className="block font-bold font-mono text-red-600 text-xs">TIDAK TERSEDIA</span>
              )}
            </div>
          )}
        </div>
        
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
                <p className="text-black text-xs">produk sudah habis<br/>silahkan pilih produk lain</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}