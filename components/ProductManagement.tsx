"use client";
import { useEffect, useState } from "react";
import { Coffee, Trash2, Edit, Plus, Tag } from "lucide-react";
import Image from "next/image";
import { AddProductModal } from "@/app/(administrator)/dashboard-admin/components/AddProductModal";
import type { Produk, Kategori } from "@prisma/client";
import { deleteProduct, fetchCategories, getAdminProduct, updateProduct } from "@/server/actions"; // pastikan addCategory diimpor
import { toast } from "@/hooks/use-toast";
import { EditProductModal } from "./EditProductModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

type ProductWithKategori = Produk & {
  kategori: Kategori;
};

export function ProductManagement() {
  const [produk, setProduk] = useState<ProductWithKategori[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithKategori | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [category, setCategory] = useState<Kategori[]>([]);

  useEffect(() => {
    fetchProducts();
    getCategorys();
  }, []);

  const getCategorys = async () => {
    try {
      const response = await fetchCategories();
      if (response.status === "Success" && response.data) {
        setCategory(response.data);
        console.log("kategori ", response.data);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    setLoadingMessage("Fetching products...");
    try {
      const products = await getAdminProduct();
      setProduk(products);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (product: ProductWithKategori) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      setIsLoading(true);
      setLoadingMessage("Deleting product...");
      try {
        const deleteProduk = await deleteProduct(selectedProduct.produkId);
        if (deleteProduk.status === "Success") {
          toast({
            title: "Success",
            description: "Product deleted successfully",
          });
          fetchProducts();
        } else {
          toast({
            title: "Error",
            description: "Failed to delete product",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "An error occurred while deleting the product",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsDeleteModalOpen(false);
        setSelectedProduct(null);
      }
    }
  };

  const handleEditClick = (product: ProductWithKategori) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (updatedProduct: any) => {
    setIsLoading(true);
    setLoadingMessage("Updating product...");
    try {
      const result = await updateProduct(updatedProduct);
      if (result.status === "Success") {
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
        fetchProducts();
        setIsEditModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Failed to update product",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while updating the product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
      <div className="grid gap-4">
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
                >
                  <Edit size={20} />
                </button>
                <button
                  className="p-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all hover:bg-red-500 hover:text-white"
                  onClick={() => handleDeleteClick(product)}
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
        onProductAdded={() => {
          setIsLoading(true);
          setLoadingMessage("Adding new product...");
          fetchProducts();
        }}
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
