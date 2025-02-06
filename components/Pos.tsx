"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/header";
import { CategoryNav } from "@/components/category-nav";
import { ProductGrid } from "@/components/product-grid";
import { toast } from "@/hooks/use-toast";
import { createOrder, getProducts } from "@/server/actions";
import { Produk as PrismaProduk, Penjualan, DetailPenjualan } from "@prisma/client";
import { NeoSearchInput } from "./InputSearch";
import { NeoOrderSummary } from "./order-summary";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

interface Produk extends PrismaProduk {
  kategori: { nama: string }; // pastikan properti kategori ada dan memuat field nama
  image: string;
}

const Pos = () => {
  const [selectedCategory, setSelectedCategory] = useState("All Menu");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Produk[]>([]);

  const [order, setOrder] = useState<
    Penjualan & {
      detailPenjualan: (DetailPenjualan & { produk: Produk })[];
    }
  >({
    penjualanId: 0,
    tanggalPenjualan: new Date(),
    total_harga: 0,
    pelangganId: null,
    guestId: null,
    userId: 0,
    detailPenjualan: [],
  });

  const orderSummaryRef = useRef<{ resetCustomerData: () => void } | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getProducts(selectedCategory);
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Gagal mengambil data produk",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addToOrder = (product: Produk) => {
    setOrder((prev) => {
      const existingItem = prev.detailPenjualan.find((item) => item.produkId === product.produkId);

      let newDetailPenjualan: (DetailPenjualan & { produk: Produk })[];
      if (existingItem) {
        newDetailPenjualan = prev.detailPenjualan.map((item) =>
          item.produkId === product.produkId
            ? {
                ...item,
                kuantitas: item.kuantitas + 1,
                subtotal: (item.kuantitas + 1) * product.harga,
              }
            : item
        );
      } else {
        newDetailPenjualan = [
          ...prev.detailPenjualan,
          {
            detailId: 0,
            penjualanId: prev.penjualanId,
            produkId: product.produkId,
            kuantitas: 1,
            subtotal: product.harga,
            produk: product,
          },
        ];
      }

      const total_harga = newDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...prev,
        detailPenjualan: newDetailPenjualan,
        total_harga,
      };
    });
  };

  const handleUpdateQuantity = (produkId: number, newQuantity: number) => {
    setOrder((prevOrder) => {
      const updatedDetailPenjualan = prevOrder.detailPenjualan.map((item) => {
        if (item.produkId === produkId) {
          const product = products.find((p) => p.produkId === produkId);
          return {
            ...item,
            kuantitas: newQuantity,
            subtotal: newQuantity * (product?.harga || 0),
          };
        }
        return item;
      });

      const newTotal = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga: newTotal,
      };
    });
  };

  const handleDeleteItem = (produkId: number) => {
    setOrder((prevOrder) => {
      const updatedDetailPenjualan = prevOrder.detailPenjualan.filter((item) => item.produkId !== produkId);

      const newTotal = updatedDetailPenjualan.reduce((sum, item) => sum + item.subtotal, 0);

      return {
        ...prevOrder,
        detailPenjualan: updatedDetailPenjualan,
        total_harga: newTotal,
      };
    });
  };

  const handlePlaceOrder = async (orderData: Penjualan & { redeemedPoints?: number }) => {
    if (orderData.detailPenjualan.length === 0) {
      toast({
        title: "Error",
        description: "Silahkan tambahkan produk terlebih dahulu",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setIsLoading(true);
      console.log("Creating order with data:", orderData);
    console.log("redemmedPoin di handlePlaceorder di POs :",orderData.redeemedPoints)

    
      // Pastikan semua field yang diperlukan ada
      const orderPayload = {
        ...orderData,
        pelangganId: orderData.pelangganId || null,
        guestId: orderData.guestId || null,
        total_harga: orderData.total_harga,
        redeemedPoints: orderData.redeemedPoints || 0,
        userId: orderData.userId,
        detailPenjualan: orderData.detailPenjualan.map((item) => ({
          produkId: item.produkId,
          kuantitas: item.kuantitas,
          subtotal: item.subtotal,
        })),
      };
            
      console.log("Payload yang dikirim:", orderPayload);

      console.log("Order data sebelum dikirim:", orderData);
      
      const penjualan = await createOrder(orderPayload);
  
      if (penjualan) {
        toast({
          title: "Berhasil",
          description: `Pesanan berhasil dibuat. Total: Rp${(penjualan.total_harga).toLocaleString()}`,
        });
  
        setOrder({
          penjualanId: 0,
          tanggalPenjualan: new Date(),
          total_harga: 0,
          pelangganId: null,
          guestId: null,
          userId: orderData.userId,
          detailPenjualan: [],
        });
  
        if (orderSummaryRef.current) {
          orderSummaryRef.current.resetCustomerData();
        }
      } else {
        throw new Error("Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Error",
        description: "Gagal membuat pesanan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  console.log("kategory yang diselect :", selectedCategory);
  const filteredProducts = products.filter(
    (product) =>
      (product?.nama || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      (selectedCategory === "All Menu" || product?.kategori?.nama === selectedCategory)
  );

  return (
    <div className="h-screen flex flex-col bg-white">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} />
          <NeoSearchInput onSearch={handleSearch} />
          <div className="flex-1 overflow-auto">
            {isLoading ? <NeoProgressIndicator isLoading={isLoading} /> : <ProductGrid products={filteredProducts} onProductSelect={addToOrder} />}
          </div>
        </div>
        <NeoOrderSummary 
          ref={orderSummaryRef} 
          order={order} 
          onUpdateQuantity={handleUpdateQuantity} 
          onDeleteItem={handleDeleteItem} 
          onPlaceOrder={handlePlaceOrder}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default Pos;
