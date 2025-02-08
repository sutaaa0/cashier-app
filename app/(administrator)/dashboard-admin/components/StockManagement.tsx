"use client";

import React, { useState, useEffect } from "react";
import { Package, Plus, Minus, AlertTriangle, Save, RotateCcw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getStockItems, updateStockItem } from "@/server/actions";
import { NeoProgressIndicator } from "@/components/NeoProgresIndicator";

interface StockData {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
  lastUpdated: string;
}

interface DraftChanges {
  [key: number]: number; // key adalah id item, value adalah perubahan stok
}

export function StockManagement() {
  const [stock, setStock] = useState<StockData[]>([]);
  const [draftChanges, setDraftChanges] = useState<DraftChanges>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    setIsLoading(true);
    try {
      const result = await getStockItems();
      if (result.status === "Success") {
        setStock(result.data || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch stock items",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while fetching stock items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDraft = (id: number, increment: boolean) => {
    const item = stock.find((i) => i.id === id);
    if (!item) return;

    const currentDraft = draftChanges[id] || 0;
    const newDraft = increment ? currentDraft + 1 : currentDraft - 1;

    // Cek apakah perubahan akan membuat stok menjadi negatif
    const finalStock = item.currentStock + newDraft;
    if (finalStock < 0) return;

    setDraftChanges({
      ...draftChanges,
      [id]: newDraft,
    });
  };

  const getCurrentStockWithDraft = (item: StockData) => {
    const draft = draftChanges[item.id] || 0;
    return item.currentStock + draft;
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Simpan semua perubahan
      const updatePromises = Object.entries(draftChanges).map(([id, change]) => {
        const item = stock.find((i) => i.id === Number(id));
        if (!item) return null;

        const newStock = item.currentStock + change;
        return updateStockItem(Number(id), newStock);
      });

      const results = await Promise.all(updatePromises.filter(Boolean));

      // Update local state jika semua perubahan berhasil
      const allSuccess = results.every((result) => result?.status === "Success");
      if (allSuccess) {
        setStock(
          stock.map((item) => {
            const change = draftChanges[item.id] || 0;
            return change !== 0 ? { ...item, currentStock: item.currentStock + change, lastUpdated: new Date().toISOString() } : item;
          })
        );
        setDraftChanges({}); // Reset draft changes
        toast({
          title: "Success",
          description: "All changes saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Some changes failed to save",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while saving changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDraft = () => {
    setDraftChanges({});
    toast({
      title: "Draft Reset",
      description: "All draft changes have been discarded",
    });
  };

  const hasPendingChanges = Object.keys(draftChanges).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">STOCK MANAGEMENT</h2>
        <div className="flex gap-2">
          {hasPendingChanges && (
            <>
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="px-4 py-2 bg-green-500 text-white font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
              >
                <Save size={20} />
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={handleResetDraft}
                disabled={isSaving}
                className="px-4 py-2 bg-gray-500 text-white font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
              >
                <RotateCcw size={20} />
                Reset
              </button>
            </>
          )}
        </div>
      </div>
      {isLoading ? (
        <NeoProgressIndicator isLoading={true} />
      ) : (
        <div className="grid gap-4">
          {stock.map((item) => {
            const draftChange = draftChanges[item.id] || 0;
            const currentStockWithDraft = getCurrentStockWithDraft(item);

            return (
              <div key={item.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#93B8F3] border-[3px] border-black">
                      <Package size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{item.name}</h3>
                      <span className="inline-block px-2 py-1 bg-black text-white text-sm">{item.category}</span>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-sm">Last Updated: {new Date(item.lastUpdated).toLocaleString()}</span>
                        {currentStockWithDraft <= item.minStock && (
                          <span className="flex items-center text-red-500 text-sm font-bold">
                            <AlertTriangle size={16} className="mr-1" />
                            Low Stock
                          </span>
                        )}
                        {draftChange !== 0 && (
                          <span className="text-blue-500 text-sm font-bold">
                            ({draftChange > 0 ? "+" : ""}
                            {draftChange})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-4 py-2 bg-[#93B8F3] border-[3px] border-black">
                      <button onClick={() => handleUpdateDraft(item.id, false)} disabled={currentStockWithDraft <= 0} className="p-1 hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        <Minus size={20} />
                      </button>
                      <span className="font-bold min-w-[40px] text-center">{currentStockWithDraft}</span>
                      <button onClick={() => handleUpdateDraft(item.id, true)} className="p-1 hover:bg-black hover:text-white">
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
