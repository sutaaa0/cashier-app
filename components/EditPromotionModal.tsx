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

  // Debug information
  useEffect(() => {
    console.log("EditPromotionModal received products:", products);
    console.log("EditPromotionModal received promotion:", promotion);
  }, [products, promotion]);

  // Initialize form with promotion data
  useEffect(() => {
    if (promotion) {
      try {
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
        const discountType = promotion.discountPercentage !== null && promotion.discountPercentage !== undefined 
          ? "percentage" 
          : "amount";
          
        const discountValue = discountType === "percentage"
          ? (promotion.discountPercentage || 0)
          : (promotion.discountAmount || 0);

        // Extract product IDs from the promotion
        let productIds: number[] = [];
        
        if (promotion.products && Array.isArray(promotion.products) && promotion.products.length > 0) {
          // Direct products array
          productIds = promotion.products.map(p => p.produkId);
        } else if (promotion.promotionProducts && Array.isArray(promotion.promotionProducts)) {
          // Products in promotionProducts relationship
          productIds = promotion.promotionProducts
            .map(pp => pp.produk?.produkId || pp.produkId)
            .filter(id => id !== undefined);
        }
        
        console.log("Setting selected product IDs:", productIds);

        // Set form data
        setFormData({
          title: promotion.title || "",
          description: promotion.description || "",
          type: promotion.type || PromotionType.PRODUCT_SPECIFIC,
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          discountType,
          discountValue,
          minQuantity: promotion.minQuantity || 0,
          selectedProductIds: productIds,
          startTime: `${startHours}:${startMinutes}`,
          endTime: `${endHours}:${endMinutes}`,
          isEditMode: true
        });
      } catch (error) {
        console.error("Error initializing form data:", error);
        toast({
          title: "Error",
          description: "Failed to load promotion data",
          variant: "destructive",
        });
      }
    }
  }, [promotion, toast]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    
    console.log("Submitting form with data:", formData);
    
    startTransition(async () => {
      try {
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
  
        console.log("Submitting update with:", input);
        console.log("Selected product IDs:", formData.selectedProductIds);
  
        const result = await updatePromotion(promotion.promotionId, input);
        if (result.success) {
          toast({
            title: "Success",
            description: "Promotion updated successfully",
          });
          onSuccess();
          onClose();
        } else {
          // Check for conflicting products error
          if (result.error && result.error.includes("Beberapa produk sudah memiliki promosi aktif")) {
            try {
              // Extract the JSON part from the error message
              const errorMessageParts = result.error.split("Beberapa produk sudah memiliki promosi aktif: ");
              if (errorMessageParts.length > 1) {
                const conflictDataString = errorMessageParts[1];
                const conflictingProducts = JSON.parse(conflictDataString);
                
                // Generate a more user-friendly message
                const errorDetails = (
                  <div className="mt-2">
                    <p className="font-bold">Produk dengan promosi aktif:</p>
                    <ul className="list-disc pl-5 mt-1">
                      {conflictingProducts.map((product: any, index: number) => (
                        <li key={index}>
                          <span className="font-semibold">{product.nama}</span> - dalam promosi "{product.promosi}" (berakhir: {product.berakhir})
                        </li>
                      ))}
                    </ul>
                  </div>
                );
                
                toast({
                  title: "Konflik Promosi",
                  description: (
                    <div>
                      <p>Satu produk hanya boleh memiliki satu promosi aktif. Harap hapus produk berikut atau tunggu promosi berakhir.</p>
                      {errorDetails}
                    </div>
                  ),
                  variant: "destructive",
                });
              } else {
                toast({
                  title: "Error",
                  description: result.error || "Failed to update promotion",
                  variant: "destructive",
                });
              }
            } catch (parseError) {
              console.error("Error parsing conflict data:", parseError);
              toast({
                title: "Error",
                description: result.error || "Failed to update promotion",
                variant: "destructive",
              });
            }
          } else {
            toast({
              title: "Error",
              description: result.error || "Failed to update promotion",
              variant: "destructive",
            });
          }
        }
      } catch (error) {
        console.error("Error updating promotion:", error);
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
      <div className="bg-white border-4 border-black p-6 max-w-2xl w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-y-auto h-[90%]">
        <h3 className="text-2xl font-bold mb-4 transform -rotate-2 inline-block relative">
          Edit Promosi
          <div className="absolute -bottom-1 left-0 w-full h-2 bg-[#FFD700] transform -rotate-2 -z-10"></div>
        </h3>
        
        {/* Debug info (remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-4 p-2 bg-gray-100 rounded text-xs">
            <p>Selected Products: {formData.selectedProductIds.length}</p>
            <p>Available Products: {products?.length || 0}</p>
          </div>
        )}
        
        <PromotionForm
          formData={formData}
          setFormData={setFormData}
          products={products || []}
          isPending={isPending}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}