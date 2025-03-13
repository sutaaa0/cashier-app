"use client"

import { useState } from "react"
import Image from "next/image"
import { Search, Minus, Plus, Tag, X } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"
import { searchProducts } from "@/server/actions"
import { Button } from "../ui/button"

interface ReplacementItem {
  produkId: number;
  nama: string;
  kuantitas: number;
  harga: number; // Original price
  effectivePrice: number; // Price after discounts
  image: string;
  promotionTitle?: string;
  discountPercentage?: number;
  discountAmount?: number;
}

interface Product {
  produkId: number;
  nama: string;
  harga: number;
  stok: number;
  image: string;
}

interface Promotion {
  promotionId: number;
  title: string;
  discountPercentage?: number;
  discountAmount?: number;
  produkIds: number[];
}

interface ReplacementItemsProps {
  items: ReplacementItem[];
  setItems: (items: ReplacementItem[]) => void;
  setTotalReplacement: (total: number) => void;
  activePromotions: Promotion[];
}

export function ReplacementItems({ 
  items, 
  setItems, 
  setTotalReplacement,
  activePromotions
}: ReplacementItemsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const results = await searchProducts(searchQuery)
      setSearchResults(results || [])
    } catch (error) {
      console.error("Error searching products:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const addProduct = (product: Product) => {
    // Check if product already exists in items
    const existingItemIndex = items.findIndex(item => item.produkId === product.produkId)
    
    // Apply any active promotions to the product
    const applicablePromotion = activePromotions.find(promo => 
      promo.produkIds.includes(product.produkId)
    )
    
    let discountPercentage = undefined
    let discountAmount = undefined
    let promotionTitle = undefined
    let effectivePrice = product.harga
    
    if (applicablePromotion) {
      discountPercentage = applicablePromotion.discountPercentage
      discountAmount = applicablePromotion.discountAmount
      promotionTitle = applicablePromotion.title
      
      // Calculate effective price
      if (discountPercentage) {
        effectivePrice = Math.round(product.harga * (1 - (discountPercentage / 100)))
      } else if (discountAmount) {
        effectivePrice = Math.round(product.harga - discountAmount)
      }
    }
    
    if (existingItemIndex > -1) {
      // Update existing item
      const newItems = [...items]
      newItems[existingItemIndex].kuantitas += 1
      setItems(newItems)
    } else {
      // Add new item
      const newItem: ReplacementItem = {
        produkId: product.produkId,
        nama: product.nama,
        harga: product.harga,
        effectivePrice: effectivePrice,
        kuantitas: 1,
        image: product.image,
        promotionTitle,
        discountPercentage,
        discountAmount,
      }
      setItems([...items, newItem])
    }
    
    // Clear search results
    setSearchResults([])
    setSearchQuery("")
    
    // Calculate total using effective price (after discounts)
    const newItems = existingItemIndex > -1 
      ? items.map((item, i) => i === existingItemIndex ? {...item, kuantitas: item.kuantitas + 1} : item)
      : [...items, {
          produkId: product.produkId,
          nama: product.nama,
          harga: product.harga,
          effectivePrice: effectivePrice,
          kuantitas: 1,
          image: product.image,
          promotionTitle,
          discountPercentage,
          discountAmount,
        }]
    
    const total = newItems.reduce((sum, item) => sum + item.effectivePrice * item.kuantitas, 0)
    setTotalReplacement(total)
  }

  const updateItemQuantity = (produkId: number, change: number) => {
    const newItems = items.map((item) => {
      if (item.produkId === produkId) {
        const newQuantity = Math.max(0, item.kuantitas + change)
        return newQuantity === 0 ? null : { ...item, kuantitas: newQuantity }
      }
      return item
    }).filter(Boolean) as ReplacementItem[]
    
    setItems(newItems)
    
    // Calculate total using effective price (after discounts)
    const total = newItems.reduce((sum, item) => sum + item.effectivePrice * item.kuantitas, 0)
    setTotalReplacement(total)
  }

  const removeItem = (produkId: number) => {
    const newItems = items.filter(item => item.produkId !== produkId)
    setItems(newItems)
    
    // Calculate total
    const total = newItems.reduce((sum, item) => sum + item.effectivePrice * item.kuantitas, 0)
    setTotalReplacement(total)
  }
  
  // Calculate discount percentage from original price to effective price
  const calculateDiscountPercent = (original: number, effective: number) => {
    if (original <= 0) return 0
    const discountPercent = ((original - effective) / original) * 100
    return Math.round(discountPercent)
  }

  return (
    <div className="text-text border-2 border-border dark:border-darkBorder shadow-light dark:shadow-dark hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none dark:hover:shadow-none transition-all p-3">
      <h2 className="text-2xl font-bold mb-4 transform -rotate-1 inline-block">Replacement Products</h2>
      
      <div className="mb-4 flex">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Cari produk pengganti..."
          className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
        />
        <Button
          onClick={handleSearch}
          className="ms-3 px-4 py-2 bg-[#FFD700] text-black font-bold "
        >
          {isSearching ? "..." : <Search className="h-5 w-5" />}
        </Button>
      </div>
      
      {searchResults.length > 0 && (
        <div className="mb-4 border-2 border-black p-2 max-h-40 overflow-y-auto">
          {searchResults.map((product) => (
            <div 
              key={product.produkId} 
              className="flex items-center justify-between p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => addProduct(product)}
            >
              <div className="flex items-center gap-2">
                <Image src={product.image || "/placeholder.svg"} alt={product.nama} width={30} height={30} />
                <p>{product.nama}</p>
              </div>
              <div className="flex items-center gap-2">
                <p>{formatRupiah(product.harga)}</p>
                <p className="text-sm text-gray-500">Stok: {product.stok}</p>
                
                {/* Show promo tag if product has active promotion */}
                {activePromotions.some(promo => promo.produkIds.includes(product.produkId)) && (
                  <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-md">
                    PROMO
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.produkId} className="flex items-center justify-between p-2 border-2 border-black">
            <div className="flex items-center gap-4">
              <Image src={item.image || "/placeholder.svg"} alt={item.nama} width={50} height={50} />
              <div>
                <p className="font-bold">{item.nama}</p>
                <div className="flex items-center gap-2">
                  {item.effectivePrice < item.harga ? (
                    <>
                      <span className="line-through text-gray-500 text-sm">{formatRupiah(item.harga)}</span>
                      <span className="font-semibold">{formatRupiah(item.effectivePrice)}</span>
                      <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-md flex items-center">
                        <Tag className="h-3 w-3 mr-1" />
                        {item.discountPercentage 
                          ? `-${item.discountPercentage}%` 
                          : `-${calculateDiscountPercent(item.harga, item.effectivePrice)}%`}
                      </span>
                    </>
                  ) : (
                    <span>{formatRupiah(item.harga)}</span>
                  )}
                </div>
                {item.promotionTitle && (
                  <p className="text-xs text-blue-600">{item.promotionTitle}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <button
                  onClick={() => updateItemQuantity(item.produkId, -1)}
                  className="p-1 bg-gray-200 rounded-full hover:bg-[#FFD700]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="mx-2 font-bold">{item.kuantitas}</span>
                <button
                  onClick={() => updateItemQuantity(item.produkId, 1)}
                  className="p-1 bg-gray-200 rounded-full hover:bg-[#FFD700]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => removeItem(item.produkId)}
                className="p-1 bg-red-100 text-red-500 rounded-full hover:bg-red-500 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <p className="text-center text-gray-500 py-4">There is no replacement product yet. Search the above products to add.</p>
        )}
      </div>
    </div>
  )
}