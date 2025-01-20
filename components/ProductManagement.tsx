"use client";

import { useEffect, useState } from "react";
import { Coffee, Trash2, Edit, Plus, Tag } from "lucide-react";
import Image from "next/image";
import { AddProductModal } from "@/app/(administrator)/dashboard-admin/components/AddProductModal";
import { Produk } from "@prisma/client";
import { deleteProduct, getProducts, updateProduct } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { EditProductModal } from "./EditProductModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

export function ProductManagement() {
  const [produk, setProduk] = useState<Produk[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produk | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const produk = await getProducts();
      setProduk(produk);
      return;
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteClick = (product: Produk) => {
    setSelectedProduct(product);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (selectedProduct) {
      try {
        const deleteProduk = await deleteProduct(selectedProduct.produkId);

        if (deleteProduk.status === "Success") {
          toast({
            title: "Success",
            description: "Produk berhasil dihapus",
          });
          fetchProducts();
        } else {
          toast({
            title: "Error",
            description: "Produk gagal dihapus",
            variant: "destructive",
          });
        }
      } catch (error) {
        throw error;
      }
    }

    setIsDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const handleEditClick = (product: Produk) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async (updatedProduct: any) => {
    try {
      const result = await updateProduct(updatedProduct);

      if (result.status === "Success") {
        toast({
          title: "Berhasil",
          description: "Produk berhasil diupdate",
        });
        fetchProducts();
        setIsEditModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Gagal mengupdate produk",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Gagal mengupdate produk",
        variant: "destructive",
      });
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
                  {product.image ? <Image src={product.image || "/placeholder.svg"} alt={product.nama} width={100} height={100} className="w-full h-full object-cover" /> : <Coffee size={32} />}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{product.nama}</h3>
                  <p className="text-sm">
                    Price: ${product.harga.toFixed(2)} | Stock: {product.stok}
                  </p>
                  <div className="flex items-center mt-1">
                    <Tag size={16} className="mr-1" />
                    <span className="text-sm">{product.kategori}</span>
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
      {/* Modal Add Product yang sudah ada */}
      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Modal Edit Product */}
      {selectedProduct && <EditProductModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} product={selectedProduct} onEditProduct={handleEditProduct} />}

      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteProduct} itemName={selectedProduct?.nama || ""} subject="Produk" />
    </div>
  );
}
