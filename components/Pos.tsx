"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { CategoryNav } from "@/components/category-nav";
import { ProductGrid } from "@/components/product-grid";
import { OrderSummary } from "@/components/order-summary";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createOrder, getProducts } from "@/server/actions";
import { Produk as PrismaProduk, Penjualan, DetailPenjualan } from "@prisma/client";

interface Produk extends PrismaProduk {
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
    pelangganId: 0,
    detailPenjualan: [],
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await getProducts();
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

  const handlePlaceOrder = async (customerData: { pelangganId: number }) => {
    if (order.detailPenjualan.length === 0) {
      toast({
        title: "Error",
        description: "Silahkan tambahkan produk terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    try {
      const penjualan = await createOrder({
        ...order,
        pelangganId: customerData.pelangganId, // Ensure valid pelangganId
      });

      if (penjualan) {
        toast({
          title: "Berhasil",
          description: `Pesanan berhasil dibuat. Total: Rp${order.total_harga.toLocaleString()}`,
        });
      }

      // Reset order
      setOrder({
        penjualanId: 0,
        tanggalPenjualan: new Date(),
        total_harga: 0,
        pelangganId: 1, // Reset to default customer
        detailPenjualan: [],
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Gagal membuat pesanan. Silahkan coba lagi.",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter((product) => (product?.nama || "").toLowerCase().includes(searchQuery.toLowerCase()) && (selectedCategory === "All Menu" || product?.kategori === selectedCategory));

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <CategoryNav selected={selectedCategory} onSelect={setSelectedCategory} />
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-2 top-3 h-6 w-6 text-muted-foreground" />
              <Input placeholder="Cari produk..." className="pl-9 h-12" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-auto">{isLoading ? <div className="flex items-center justify-center h-full">Loading...</div> : <ProductGrid products={filteredProducts} onProductSelect={addToOrder} />}</div>
        </div>
        <OrderSummary order={order} onUpdateQuantity={handleUpdateQuantity} onDeleteItem={handleDeleteItem} onPlaceOrder={handlePlaceOrder} />
      </div>
    </div>
  );
};

export default Pos;
