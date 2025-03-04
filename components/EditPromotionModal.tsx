"use client";

import React, { useState, useEffect, useTransition } from "react";
import { PromotionForm } from "./PromotionForm";
import { PromotionType } from "@prisma/client";
import { updatePromotion } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { EditPromotionModalProps, PromotionFormData, CreatePromotionInput } from "@/types/promotion";

export function EditPromotionModal({ promotion, products, onClose, onSuccess }: EditPromotionModalProps): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState<PromotionFormData>({
    title: "",
    description: "",
    type: PromotionType.PRODUCT_SPECIFIC,
    startDate: "",
    endDate: "",
    discountType: "percentage",
    discountValue: 0,
    minQuantity: 0,
    selectedProductIds: [],
    startTime: "00:00",
    endTime: "23:59",
    isEditMode: true
  });

  // Initialize form with promotion data
  useEffect(() => {
    if (promotion) {
      const startDate = new Date(promotion.startDate);
      const endDate = new Date(promotion.endDate);

      // Format dates for input fields
      const formattedStartDate = startDate.toISOString().split("T")[0];
      const formattedEndDate = endDate.toISOString().split("T")[0];

      // Format times for input fields
      const startHours = String(startDate.getHours()).padStart(2, "0");
      const startMinutes = String(startDate.getMinutes()).padStart(2, "0");
      const endHours = String(endDate.getHours()).padStart(2, "0");
      const endMinutes = String(endDate.getMinutes()).padStart(2, "0");

      // Determine discount type and value
      const discountType = promotion.discountPercentage !== null ? "percentage" : "amount";
      const discountValue = promotion.discountPercentage !== null ? 
                           (promotion.discountPercentage || 0) : 
                           (promotion.discountAmount || 0);

      // Check related products
      const hasProducts = promotion.products && promotion.products.length > 0;

      setFormData({
        title: promotion.title,
        description: promotion.description || "",
        type: promotion.type,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        discountType,
        discountValue,
        minQuantity: promotion.minQuantity || 0,
        selectedProductIds: hasProducts ? promotion.products?.map((p) => p.produkId) ?? [] : [],
        startTime: `${startHours}:${startMinutes}`,
        endTime: `${endHours}:${endMinutes}`,
        isEditMode: true
      });
    }
  }, [promotion]);

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    // Form validation is now handled in the PromotionForm component
    
    startTransition(async () => {
      const combinedStartDate = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const combinedEndDate = new Date(`${formData.endDate}T${formData.endTime}:00`);

      const input: CreatePromotionInput = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        startDate: combinedStartDate,
        endDate: combinedEndDate,
        discountPercentage: formData.discountType === "percentage" ? formData.discountValue : undefined,
        discountAmount: formData.discountType === "amount" ? formData.discountValue : undefined,
        minQuantity: formData.type === PromotionType.QUANTITY_BASED ? formData.minQuantity : undefined,
        productIds: formData.selectedProductIds,
      };

      try {
        const result = await updatePromotion(promotion.promotionId, input);
        if (result.success) {
          toast({
            title: "Success",
            description: "Promotion updated successfully",
          });
          onSuccess();
          onClose();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update promotion",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black p-6 max-w-2xl w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="text-2xl font-bold mb-4 transform -rotate-2 inline-block relative">
          Edit Promosi
          <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FFD700] transform -rotate-2 -z-10"></div>
        </h3>
        <PromotionForm
          formData={formData}
          setFormData={setFormData}
          products={products}
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}