"use client";
import React, { useState, useTransition, } from "react";
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  // Don't filter products for the add modal - server will handle validation
  // This ensures we show all available products
  const availableProducts = products;

  const validateForm = (): boolean => {
    const errors = [];
    
    // Basic validation
    if (!formData.title.trim()) {
      errors.push("Title is required");
    }
    
    if (!formData.startDate) {
      errors.push("Start date is required");
    }
    
    if (!formData.endDate) {
      errors.push("End date is required");
    }
    
    if (formData.discountValue <= 0) {
      errors.push("Discount value must be greater than 0");
    }
    
    if (formData.type === PromotionType.PRODUCT_SPECIFIC && formData.selectedProductIds.length === 0) {
      errors.push("At least one product must be selected for product-specific promotions");
    }
    
    if (formData.type === PromotionType.QUANTITY_BASED && formData.minQuantity <= 0) {
      errors.push("Minimum quantity must be greater than 0 for quantity-based promotions");
    }
    
    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const end = new Date(`${formData.endDate}T${formData.endTime}:00`);
      
      if (end <= start) {
        errors.push("End date must be after start date");
      }
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Show validation errors
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }
    
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
        const result = await createPromotion(input);
        if (result.success) {
          toast({
            title: "Success",
            description: "Promotion created successfully",
          });
          onSuccess();
          onClose();
        } else {
          // Check if the error contains information about conflicting products
          if (result.error && result.error.includes("Beberapa produk sudah memiliki promosi aktif")) {
            try {
              // Extract the JSON part from the error message
              const errorMessageParts = result.error.split("Beberapa produk sudah memiliki promosi aktif: ");
              if (errorMessageParts.length > 1) {
                const conflictDataString = errorMessageParts[1];
                const conflictingProducts = JSON.parse(conflictDataString);
                
                // Format the conflicts for better display
                const conflictMessages = conflictingProducts.map((product: any) => 
                  `"${product.nama}" sudah dalam promosi "${product.promosi}" (berakhir: ${product.berakhir})`
                );
                
                // Display detailed error
                setValidationErrors([
                  "Beberapa produk sudah memiliki promosi aktif:",
                  ...conflictMessages
                ]);
                
                toast({
                  title: "Produk Sudah Dalam Promosi",
                  description: "Silakan hapus produk yang sudah memiliki promosi aktif atau tunggu promosi berakhir",
                  variant: "destructive",
                });
              } else {
                // Fallback if parsing fails
                toast({
                  title: "Error",
                  description: result.error || "Failed to create promotion",
                  variant: "destructive",
                });
              }
            } catch (parseError) {
              console.error(parseError);
              // If JSON parsing fails, show the original error
              toast({
                title: "Error",
                description: result.error || "Failed to create promotion",
                variant: "destructive",
              });
            }
          } else {
            // Regular error handling
            toast({
              title: "Error",
              description: result.error || "Failed to create promotion",
              variant: "destructive",
            });
          }
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 h-screen">
      <div className="bg-white border-4 border-black p-6 max-w-2xl w-full mx-4  shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-y-auto h-[90%]">
        <h3 className="text-2xl font-bold mb-4 transform -rotate-2 inline-block relative">
          Tambah Promosi Baru
          <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FFD700] transform -rotate-2 -z-10"></div>
        </h3>
        
        {validationErrors.length > 0 && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded">
            <p className="font-bold text-red-800">Please fix the following errors:</p>
            <ul className="list-disc ml-4">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-red-700">{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        <PromotionForm
          formData={formData}
          setFormData={setFormData}
          products={availableProducts} // Use filtered products here
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}