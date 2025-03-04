"use client";

import React, { useState, useTransition } from "react";
import { PromotionForm } from "./PromotionForm";
import { PromotionType } from "@prisma/client";
import { createPromotion } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { AddPromotionModalProps, PromotionFormData, CreatePromotionInput } from "@/types/promotion";

const defaultFormData: PromotionFormData = {
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
  isEditMode: false
};

export function AddPromotionModal({ products, onClose, onSuccess }: AddPromotionModalProps): React.ReactElement {
  const [formData, setFormData] = useState<PromotionFormData>(defaultFormData);
  const [isPending, startTransition] = useTransition();

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
        productIds: formData.selectedProductIds, // Use selectedProductIds directly
      };

      try {
        const result = await createPromotion(input);
        if (result.success) {
          toast({
            title: "Success",
            description: "Promotion created successfully",
          });
          onSuccess();
          onClose();
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create promotion",
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
          Tambah Promosi Baru
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