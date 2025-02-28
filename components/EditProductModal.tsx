"use client";
import React, { useState, useEffect, useRef } from "react";
import { X, Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { Produk, Kategori } from "@prisma/client";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Produk & {
    kategori: Kategori;
  };
  categories: Kategori[];
  onEditProduct: (product: { 
    id: string; 
    name: string; 
    price: number; 
    costPrice: number; // Added costPrice (hargaModal)
    stock: number; 
    minimumStok: number; 
    category: string; 
    imageUrl: string 
  }) => void;
}

export function EditProductModal({ isOpen, onClose, product, categories: initialCategories, onEditProduct }: EditProductModalProps) {
  const [productName, setProductName] = useState(product.nama);
  const [price, setPrice] = useState(product.harga.toString());
  const [costPrice, setCostPrice] = useState(product.hargaModal.toString()); // Added costPrice state
  const [stock, setStock] = useState(product.stok.toString());
  const [minStock, setMinStock] = useState(product.minimumStok.toString());
  const [category, setCategory] = useState(product.kategori.nama);
  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState(product.image);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localCategories, setLocalCategories] = useState<Kategori[]>(initialCategories);

  useEffect(() => {
    if (isOpen) {
      setProductName(product.nama);
      setPrice(product.harga.toString());
      setCostPrice(product.hargaModal.toString()); // Set costPrice from product data
      setStock(product.stok.toString());
      setMinStock(product.minimumStok.toString());
      setCategory(product.kategori.nama);
      setCurrentImageUrl(product.image);
      setImage(null);
      setLocalCategories(initialCategories);
    }
  }, [isOpen, product, initialCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let imageUrl = currentImageUrl;
      if (image) {
        const formData = new FormData();
        formData.append("file", image);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }
        const uploadResult = await uploadResponse.json();
        imageUrl = uploadResult.secure_url;
      }
      const updatedProduct = {
        id: product.produkId.toString(),
        name: productName,
        price: parseFloat(price),
        costPrice: parseFloat(costPrice), // Include costPrice in updated product
        stock: parseInt(stock, 10),
        minimumStok: parseInt(minStock, 10),
        category,
        imageUrl,
      };
      await onEditProduct(updatedProduct);
      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit Product</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="productName" className="block mb-1 font-bold">
              Product Name
            </label>
            <input type="text" id="productName" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]" required />
          </div>
          <div>
            <label htmlFor="price" className="block mb-1 font-bold">
              Selling Price
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          {/* Add Cost Price Field */}
          <div>
            <label htmlFor="costPrice" className="block mb-1 font-bold">
              Cost Price
            </label>
            <input
              type="number"
              id="costPrice"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              min="0"
              step="0.01"
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          <div>
            <label htmlFor="stock" className="block mb-1 font-bold">
              Stock
            </label>
            <input type="number" id="stock" value={stock} onChange={(e) => setStock(e.target.value)} min="0" className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]" required />
          </div>
          <div>
            <label htmlFor="minStock" className="block mb-1 font-bold">
              Minimum Stock
            </label>
            <input type="number" id="minStock" value={minStock} onChange={(e) => setMinStock(e.target.value)} min="0" className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]" required />
          </div>
          <div>
            <label htmlFor="category" className="block mb-1 font-bold">
              Category
            </label>
            <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]" required>
              <option value="" disabled>
                Select Category
              </option>
              {localCategories.map((cat) => (
                <option key={cat.kategoriId} value={cat.nama}>
                  {cat.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="image" className="block mb-1 font-bold">
              Current Image
            </label>
            {currentImageUrl && (
              <div className="mb-2">
                <Image src={currentImageUrl} alt="Current product" width={100} height={100} className="border-2 border-black rounded" />
              </div>
            )}
            <input type="file" id="image" onChange={handleImageChange} className="hidden" accept="image/*" ref={fileInputRef} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 bg-white font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Change Image
            </button>
            {image && <p className="mt-2 text-sm">{image.name}</p>}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Update Product
          </button>
        </form>
      </div>
      <NeoProgressIndicator isLoading={isLoading} message="Updating product..." />
    </div>
  );
}