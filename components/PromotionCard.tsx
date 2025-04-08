"use client";

import React, { memo } from "react";
import { Trash2, Calendar, Tag, Percent, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/formatIdr";
import { Promotion } from "@/types/promotion";

interface PromotionCardProps {
  promotion: Promotion;
  onEdit: (promotion: Promotion) => void;
  onDelete: (promotion: Promotion) => void;
  disabled: boolean;
}

const PromotionCard = memo(({ promotion, onEdit, onDelete, disabled }: PromotionCardProps) => {
  // Memoized status functions
  const status = getPromotionStatus(promotion.startDate, promotion.endDate);
  const statusColor = getPromotionStatusColor(status);

  return (
    <div
      className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
               transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
               hover:translate-x-[4px] hover:translate-y-[4px]"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold transform -rotate-1">{promotion.title}</h3>
            <span className={`px-2 py-1 text-xs font-black border-2 border-black ${statusColor} transform rotate-2`}>{status}</span>
          </div>
          <p className="text-gray-600">{promotion.description}</p>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-1 bg-blue-100 px-3 py-1 border-2 border-black">
              {promotion.discountPercentage ? (
                <>
                  <Percent size={16} className="text-blue-500" />
                  <span className="font-bold">{promotion.discountPercentage}%</span>
                </>
              ) : (
                <>
                  <DollarSign size={16} className="text-green-500" />
                  <span className="font-bold">{formatRupiah(promotion.discountAmount || 0)}</span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1 bg-purple-100 px-3 py-1 border-2 border-black">
              <Calendar size={16} className="text-purple-500" />
              <span className="font-bold">
                {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
              </span>
            </div>

            {promotion.minQuantity && (
              <div className="flex items-center gap-1 bg-orange-100 px-3 py-1 border-2 border-black">
                <Tag size={16} className="text-orange-500" />
                <span className="font-bold">Min. {promotion.minQuantity} item</span>
              </div>
            )}
          </div>

          {/* Display related products if any */}
          {promotion.products && promotion.products.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-bold">Produk:</p>
              <div className="flex flex-wrap gap-2">
                {promotion.products.map((product) => (
                  <span key={product.produkId} className="px-2 py-1 text-xs bg-gray-100 border-2 border-black font-bold transform -rotate-1">
                    {product.nama}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="neutral"
            size="icon"
            onClick={() => onDelete(promotion)}
            disabled={disabled}
            className="p-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                     active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all hover:bg-red-500 hover:text-white transform -rotate-2"
          >
            <Trash2 size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
});

PromotionCard.displayName = "PromotionCard";

// Helper functions with proper type definitions
function getPromotionStatus(startDate: string | Date, endDate: string | Date): string {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (now < start) return "AKAN DATANG";
  if (now > end) return "BERAKHIR";
  return "AKTIF";
}

function getPromotionStatusColor(status: string): string {
  switch (status) {
    case "AKTIF":
      return "bg-[#4ECDC4] text-black";
    case "AKAN DATANG":
      return "bg-[#FFD93D] text-black";
    case "BERAKHIR":
      return "bg-gray-200 text-black";
    default:
      return "bg-gray-200 text-black";
  }
}

export { PromotionCard };
