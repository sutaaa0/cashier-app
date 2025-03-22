"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Minus, AlertTriangle, Save, RotateCcw, Package, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getStockItemsManagement, updateStockItem } from "@/server/actions";
import { NeoProgressIndicator } from "@/components/NeoProgresIndicator";
import Image from "next/image";

interface StockData {
  id: number;
  name: string;
  currentStock: number;
  minStock: number;
  category: string;
  lastUpdated: string;
  image?: string;
}

interface DraftChanges {
  [key: number]: number;
}

export function StockManagement() {
  const [originalStock, setOriginalStock] = useState<StockData[]>([]);
  const [draftChanges, setDraftChanges] = useState<DraftChanges>({});
  const [draftInputs, setDraftInputs] = useState<{[key: number]: string}>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inputMode, setInputMode] = useState<{[key: number]: 'absolute' | 'relative'}>({});

  useEffect(() => {
    fetchStockItems();
  }, []);

  const fetchStockItems = async () => {
    setIsLoading(true);
    try {
      const result = await getStockItemsManagement();
      if (result.status === "Success") {
        setOriginalStock(result.data || []);
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

  // Filter stock based on search term
  const stock = useMemo(() => {
    if (!searchTerm) return originalStock;
    
    const searchTermLower = searchTerm.toLowerCase();
    return originalStock.filter(item => 
      item.name.toLowerCase().includes(searchTermLower) ||
      item.category.toLowerCase().includes(searchTermLower) ||
      item.currentStock.toString().includes(searchTermLower) ||
      item.minStock.toString().includes(searchTermLower)
    );
  }, [originalStock, searchTerm]);

  const handleUpdateDraft = (id: number, increment: boolean) => {
    const item = stock.find((i) => i.id === id);
    if (!item) return;

    const currentDraft = draftChanges[id] || 0;
    const newDraft = increment ? currentDraft + 1 : currentDraft - 1;

    // Check if the change would make stock negative
    const finalStock = item.currentStock + newDraft;
    if (finalStock < 0) return;

    setDraftChanges({
      ...draftChanges,
      [id]: newDraft,
    });
    
    // Update input field value to reflect the change
    setDraftInputs({
      ...draftInputs,
      [id]: newDraft.toString(),
    });
    
    // Set input mode to relative by default when using buttons
    if (!inputMode[id]) {
      setInputMode({
        ...inputMode,
        [id]: 'relative'
      });
    }
  };

  const handleDraftInputChange = (id: number, value: string) => {
    // Allow input to be empty
    if (value === '') {
      setDraftInputs({
        ...draftInputs,
        [id]: '',
      });
      
      // Remove from draft changes if empty
      const newDraftChanges = { ...draftChanges };
      delete newDraftChanges[id];
      setDraftChanges(newDraftChanges);
      return;
    }
    
    // Allow minus sign for relative negative values
    const cleanValue = value.replace(/[^-0-9]/g, '');
    
    // Update draft input
    setDraftInputs({
      ...draftInputs,
      [id]: cleanValue,
    });

    const numericValue = parseInt(cleanValue) || 0;
    const item = stock.find((i) => i.id === id);
    if (!item) return;

    const mode = inputMode[id] || 'relative';
    
    // Calculate final stock based on input mode
    let finalStock;
    if (mode === 'relative') {
      finalStock = item.currentStock + numericValue;
    } else {
      // Absolute mode: the input is the final desired stock level
      finalStock = numericValue;
    }
    
    // Don't allow negative stock
    if (finalStock < 0) {
      // If in absolute mode, set to 0
      if (mode === 'absolute') {
        setDraftInputs({
          ...draftInputs,
          [id]: '0',
        });
        setDraftChanges({
          ...draftChanges,
          [id]: -item.currentStock, // Change needed to get to 0
        });
      }
      return;
    }

    // Calculate the change based on the input mode
    let change;
    if (mode === 'relative') {
      change = numericValue;
    } else {
      change = finalStock - item.currentStock;
    }

    // Update draft changes if there's a change
    if (change !== 0) {
      setDraftChanges({
        ...draftChanges,
        [id]: change,
      });
    } else {
      // Remove from draft changes if value is 0
      const newDraftChanges = { ...draftChanges };
      delete newDraftChanges[id];
      setDraftChanges(newDraftChanges);
    }
  };

  const toggleInputMode = (id: number) => {
    const item = stock.find((i) => i.id === id);
    if (!item) return;
    
    const currentMode = inputMode[id] || 'relative';
    const newMode = currentMode === 'relative' ? 'absolute' : 'relative';
    
    // Update the mode
    setInputMode({
      ...inputMode,
      [id]: newMode
    });
    
    // Convert the current input to the new mode
    const currentDraft = draftChanges[id] || 0;
    let newInputValue = '';
    
    if (newMode === 'absolute') {
      // Convert from relative to absolute
      newInputValue = (item.currentStock + currentDraft).toString();
    } else {
      // Convert from absolute to relative
      if (draftInputs[id]) {
        const absoluteValue = parseInt(draftInputs[id]) || 0;
        newInputValue = (absoluteValue - item.currentStock).toString();
      }
    }
    
    setDraftInputs({
      ...draftInputs,
      [id]: newInputValue
    });
  };

  const getCurrentStockWithDraft = (item: StockData) => {
    const draft = draftChanges[item.id] || 0;
    return item.currentStock + draft;
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Save all changes
      const updatePromises = Object.entries(draftChanges).map(([id, change]) => {
        const item = stock.find((i) => i.id === Number(id));
        if (!item) return null;

        const newStock = item.currentStock + change;
        return updateStockItem(Number(id), newStock);
      });

      const results = await Promise.all(updatePromises.filter(Boolean));

      // Update local state if all changes are successful
      const allSuccess = results.every((result) => result?.status === "Success");
      if (allSuccess) {
        setOriginalStock(
          originalStock.map((item) => {
            const change = draftChanges[item.id] || 0;
            return change !== 0 ? { ...item, currentStock: item.currentStock + change, lastUpdated: new Date().toISOString() } : item;
          })
        );
        setDraftChanges({}); // Reset draft changes
        setDraftInputs({}); // Reset draft inputs
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
    setDraftInputs({});
    setInputMode({});
    toast({
      title: "Draft Reset",
      description: "All draft changes have been discarded",
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search stock items by name, category, current stock, or min stock"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
        />
        <Search 
          size={20} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
        />
      </div>

      {isLoading ? (
        <NeoProgressIndicator isLoading={true} message="Loading Stok Management" />
      ) : (
        <div className="grid gap-4">
          {stock.length === 0 && !isLoading && (
            <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-center text-gray-500">
                {searchTerm 
                  ? `No stock items found for "${searchTerm}"` 
                  : "No stock items found"
                }
              </p>
            </div>
          )}

          {stock.map((item) => {
            const draftChange = draftChanges[item.id] || 0;
            const currentStockWithDraft = getCurrentStockWithDraft(item);
            const draftInput = draftInputs[item.id] || '';
            const mode = inputMode[item.id] || 'relative';

            return (
              <div key={item.id} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#93B8F3] border-[3px] border-black flex items-center justify-center overflow-hidden">
                      {item.image ? (
                        <Image
                          src={item.image || "/placeholder.svg"}
                          alt={item.name}
                          width={100}
                          height={100}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={32} />
                      )}
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
                      <button 
                        onClick={() => handleUpdateDraft(item.id, false)} 
                        disabled={currentStockWithDraft <= 0} 
                        className="p-1 hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus size={20} />
                      </button>
                      
                      <div className="relative">
                        <input 
                          type="text" 
                          value={draftInput}
                          onChange={(e) => handleDraftInputChange(item.id, e.target.value)}
                          placeholder={mode === 'relative' ? "+/-" : "Set to"}
                          className="w-24 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
                        />
                        <button 
                          onClick={() => toggleInputMode(item.id)}
                          className="absolute right-0 top-0 bottom-0 px-1 bg-gray-200 text-xs font-bold border-l border-gray-300 hover:bg-gray-300"
                          title={mode === 'relative' ? "Switch to absolute mode (set exact value)" : "Switch to relative mode (add/subtract)"}
                        >
                          {mode === 'relative' ? '+/-' : '='}
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => handleUpdateDraft(item.id, true)} 
                        className="p-1 hover:bg-black hover:text-white"
                      >
                        <Plus size={20} />
                      </button>
                      <div className="flex flex-col items-center ml-2">
                        <span className="text-xs text-gray-600">Current</span>
                        <span className="font-bold text-lg">{currentStockWithDraft}</span>
                      </div>
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