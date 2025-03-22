"use client";

import React, { useState, useTransition, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProductsForPromotions, getPromotions } from "@/server/actions";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { toast } from "@/hooks/use-toast";
import { AddPromotionModal } from "./AddPromotionModal";
import { EditPromotionModal } from "./EditPromotionModal";
import { PromotionCard } from "./PromotionCard";
import { useQuery } from "@tanstack/react-query";
import { Promotion, ServerResponse } from "@/types/promotion";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

export function PromotionManagement(): React.ReactElement {
  // State for modals with proper types
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Query for promotions with types - fetching this first to get the current state
  const { 
    data: promotionsData = [] as Promotion[], 
    isLoading: isPromotionsLoading,
    refetch: refetchPromotions
  } = useQuery<Promotion[], Error, Promotion[]>({
    queryKey: ['promotions'],
    queryFn: async () => {
      const res = await getPromotions() as ServerResponse<Promotion[]>;
      if (res.data) {
        // Process promotion data to ensure products are properly formatted
        return res.data.map((promo) => ({
          ...promo,
          products: promo.promotionProducts?.map((pp: any) => pp.produk) || [],
        })) as Promotion[];
      }
      return [] as Promotion[];
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000 // polling every minute
  });

  // Query for products with proper handling for the selected promotion
  const { 
    data: productsData,
    refetch: refetchProducts,
    isLoading: isProductsLoading 
  } = useQuery({
    queryKey: ['products', selectedPromotion?.promotionId],
    queryFn: async () => {
      // If we're editing, include the promotion ID to get the right products
      const res = await getProductsForPromotions(
        selectedPromotion ? selectedPromotion.promotionId : null
      );
      
      console.log("Products fetched for promotion management:", res);
      
      if (res.status === "success") {
        return {
          products: res.data || [],
          editInfo: res.editInfo || null
        };
      }
      return { products: [], editInfo: null };
    },
    enabled: isEditModalOpen || isAddModalOpen // Only fetch when a modal is open
  });

  const isLoading = isProductsLoading || isPromotionsLoading;
  const products = productsData?.products || [];

  // Handle opening add modal
  const handleAddPromotion = (): void => {
    setSelectedPromotion(null);
    setIsAddModalOpen(true);
    // Refetch products to get the latest available ones
    refetchProducts();
  };

  // Handle opening edit modal
  const handleEditPromotion = useCallback((promotion: Promotion): void => {
    setSelectedPromotion(promotion);
    // Refetch products specifically for this promotion before opening the modal
    refetchProducts().then(() => {
      setIsEditModalOpen(true);
    });
  }, [refetchProducts]);

  // Handle delete click
  const handleDeleteClick = useCallback((promotion: Promotion): void => {
    setSelectedPromotion(promotion);
    setIsDeleteModalOpen(true);
  }, []);

  // Handle successful actions
  const handleSuccess = useCallback((): void => {
    refetchPromotions();
  }, [refetchPromotions]);

  // Handle delete confirmation
  const handleDeleteConfirm = useCallback(async (): Promise<void> => {
    if (!selectedPromotion) return;
    
    startTransition(async () => {
      const { deletePromotion } = await import('@/server/actions');
      try {
        const deleteResult = await deletePromotion(selectedPromotion.promotionId) as ServerResponse<unknown>;
        if (deleteResult.success) {
          toast({
            title: "Delete Success",
            description: "Promotion deleted successfully",
          });
          refetchPromotions();
        } else {
          toast({
            title: "Delete Failed",
            description: deleteResult.error || "Failed to delete promotion",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Delete Failed",
          description: "An error occurred while deleting the promotion",
          variant: "destructive",
        });
        console.error(error);
      }
      setIsDeleteModalOpen(false);
      setSelectedPromotion(null);
    });
  }, [selectedPromotion, refetchPromotions]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black transform -rotate-2">PROMOTION MANAGEMENT</h2>
        <Button
          onClick={handleAddPromotion}
          className="px-6 py-3 bg-[#FFD700] font-bold text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                   hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all flex items-center gap-2"
          disabled={isPending || isLoading}
        >
          <Plus className="mr-2" />
          Add Promotion 
        </Button>
      </div>

      {/* List of Promotions */}
      <div className="grid gap-4">
        {promotionsData.length === 0 && !isLoading ? (
          <div className="text-center p-8 border-4 border-dashed border-black">
            <p className="text-xl font-bold">No promotion yet</p>
            <p className="text-gray-600">Click `&quot;Add Promotion&quot;` to create a new promotion.</p>
          </div>
        ) : (
          promotionsData.map((promotion) => (
            <PromotionCard
              key={promotion.promotionId}
              promotion={promotion}
              onEdit={handleEditPromotion}
              onDelete={handleDeleteClick}
              disabled={isPending}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {isAddModalOpen && (
        <AddPromotionModal
          products={products}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleSuccess}
        />
      )}

      {isEditModalOpen && selectedPromotion && (
        <EditPromotionModal
          promotion={selectedPromotion}
          products={products}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedPromotion(null);
          }}
          onSuccess={handleSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {selectedPromotion && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          itemName={selectedPromotion.title || "Promotion"}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteConfirm}
          subject="Promotion "
        />
      )}

      <NeoProgressIndicator isLoading={isLoading}  message="Loading Promotions"/>
    </div>
  );
}