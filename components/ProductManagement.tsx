"use client";
import { useState, useMemo } from "react";
import { Coffee, Trash2, Edit, Plus, Tag, Search } from "lucide-react";
import Image from "next/image";
import { AddProductModal } from "@/app/(administrator)/dashboard-admin/components/AddProductModal";
import type { Produk, Kategori } from "@prisma/client";
import { deleteProduct, getAdminProduct, getCategory, updateProduct } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { EditProductModal } from "./EditProductModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { NeoProgressIndicator } from "./NeoProgresIndicator";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type ProductWithKategori = Produk & {
  kategori: {
    nama: string;
    kategoriId: number;
    isDeleted: boolean;
    icon: string;
  };
};

export function ProductManagement() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithKategori | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get QueryClient instance
  const queryClient = useQueryClient();

  // Fetch products with React Query
  const { 
    data: originalProduk = [] as ProductWithKategori[], 
    isLoading: isLoadingProducts 
  } = useQuery<ProductWithKategori[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const products = await getAdminProduct();
      return products.map(product => ({
        ...product,
        kategori: {
          ...product.kategori,
          isDeleted: false, // Add default value
          icon: ''         // Add default value
        }
      }));
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
  });

  // Filtered and searched products
  const produk = useMemo(() => {
    if (!searchTerm) return originalProduk;
    
    const searchTermLower = searchTerm.toLowerCase();
    return originalProduk.filter(product => 
      product.nama.toLowerCase().includes(searchTermLower) ||
      product.kategori.nama.toLowerCase().includes(searchTermLower) ||
      product.statusStok.toLowerCase().includes(searchTermLower) ||
      product.harga.toString().includes(searchTermLower)
    );
  }, [originalProduk, searchTerm]);

  // Fetch categories with React Query
  const { 
    data: category = [] 
  } = useQuery<Kategori[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getCategory();
      return result ?? [];
    },
    staleTime: 30 * 60 * 1000, // Categories change less frequently, cache for 30 minutes
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => deleteProduct(productId),
    onMutate: () => {
      setLoadingMessage("Deleting product...");
    },
    onSuccess: (result) => {
      if (result.status === "Success") {
        toast({
          title: "Success",
          description: "Product deleted successfully",
        });
        // Invalidate and refetch products query
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while deleting the product",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsDeleteModalOpen(false);
      setSelectedProduct(null);
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: (updatedProduct: { 
      id: number; 
      name: string; 
      price: number; 
      costPrice: number; 
      stock: number; 
      minimumStok: number; 
      category: string; 
      imageUrl: string; 
    }) => updateProduct(updatedProduct),
    onMutate: () => {
      setLoadingMessage("Updating product...");
    },
    onSuccess: (result) => {
      if (result.status === "Success") {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        // Invalidate and refetch products query
        queryClient.invalidateQueries({ queryKey: ['products'] });
        setIsEditModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update product",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while updating the product",
        variant: "destructive",
      });
    }
  });

  const handleDeleteClick = (product: ProductWithKategori) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      deleteProductMutation.mutate(selectedProduct.produkId);
    }
  };

  const handleEditClick = (product: ProductWithKategori) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (updatedProduct: { id: string; name: string; price: number; costPrice: number; stock: number; minimumStok: number; category: string; imageUrl: string; }) => {
    updateProductMutation.mutate({
      id: Number(updatedProduct.id),
      name: updatedProduct.name,
      price: updatedProduct.price,
      costPrice: updatedProduct.costPrice,
      stock: updatedProduct.stock,
      minimumStok: updatedProduct.minimumStok,
      category: updatedProduct.category,
      imageUrl: updatedProduct.imageUrl || "",
    });
  };

  const handleAddProduct = () => {
    setLoadingMessage("Adding new product...");
    // After adding product, invalidate the products query
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "CRITICAL":
        return "text-red-600";
      case "LOW":
        return "text-yellow-600";
      case "NORMAL":
        return "text-green-600";
      default:
        return "";
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Calculate overall loading state
  const isLoading = isLoadingProducts || deleteProductMutation.isPending || updateProductMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">PRODUCT MANAGEMENT</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Product
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search products by name, category, status, or price"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
        />
        <Search 
          size={20} 
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
        />
      </div>

      <div className="grid gap-4">
        {produk.length === 0 && !isLoading && (
          <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-center text-gray-500">
              {searchTerm 
                ? `No products found for "${searchTerm}"` 
                : "No products found"
              }
            </p>
          </div>
        )}
        
        {produk.map((product) => (
          <div key={product.produkId} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-[#93B8F3] border-[3px] border-black flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <Image
                      src={product.image || "/placeholder.svg"}
                      alt={product.nama}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Coffee size={32} />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{product.nama}</h3>
                  <p className="text-sm">
                    Price:{" "}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(product.harga)}
                  </p>
                  <p className="text-sm">
                    Cost Price:{" "}
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                    }).format(product.hargaModal)}
                  </p>
                  <p className="text-sm">
                    Stock: {product.stok} | Min Stock: {product.minimumStok}
                    <span className={`ml-2 font-medium ${getStockStatusColor(product.statusStok)}`}>
                      ({product.statusStok})
                    </span>
                  </p>
                  <div className="flex items-center mt-1">
                    <Tag size={16} className="mr-1" />
                    <span className="text-sm">{product.kategori.nama}</span>
                  </div>
                </div>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => handleEditClick(product)}
                  className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                  disabled={isLoading}
                >
                  <Edit size={20} />
                </button>
                <button
                  className="p-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all hover:bg-red-500 hover:text-white"
                  onClick={() => handleDeleteClick(product)}
                  disabled={isLoading}
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onProductAdded={handleAddProduct}
      />
      {selectedProduct && (
        <EditProductModal
          categories={category}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          product={selectedProduct}
          onEditProduct={handleEditProduct}
        />
      )}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        itemName={selectedProduct?.nama || ""}
        subject="Product"
      />
      <NeoProgressIndicator isLoading={isLoading} message={loadingMessage} />
    </div>
  );
}