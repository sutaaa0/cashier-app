"use client";

import { NeoProgressIndicator } from "@/components/NeoProgresIndicator";
import { toast } from "@/hooks/use-toast";
import { addProduct, fetchCategories } from "@/server/actions";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductAdded: () => void;
}

export function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [productName, setProductName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | "">("");

  const [image, setImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCategories = async () => {
      const response = await fetchCategories();
      if (response.status === "Success" && response.data) {
        setCategories(response.data);
      }
    };
    loadCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast({ title: "Error", description: "Please select a product image", variant: "destructive" });
      return;
    }

    if (!selectedCategoryId) {
      toast({ title: "Error", description: "Please select a category", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // Upload product image
      const formData = new FormData();
      formData.append("file", image);

      const uploadResponse = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadResponse.ok) throw new Error("Failed to upload image");
      const uploadResult = await uploadResponse.json();

      const result = await addProduct({
        name: productName,
        price: Number(price),
        stock: Number(stock),
        minimumStok: Number(minStock) || 10,
        categoryId: Number(selectedCategoryId),
        imageUrl: uploadResult.secure_url,
      });

      if (result.status === "Success") {
        toast({ title: "Success", description: "Product added successfully" });
        onClose();
        onProductAdded();
        // Reset form fields
        setProductName("");
        setPrice("");
        setStock("");
        setMinStock("");
        setSelectedCategoryId("");
        setImage(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to add product", 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add New Product</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product fields */}
          <div>
            <label htmlFor="productName" className="block mb-1 font-bold">Product Name</label>
            <input
              type="text"
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          
          <div>
            <label htmlFor="price" className="block mb-1 font-bold">Price</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>

          <div>
            <label htmlFor="stock" className="block mb-1 font-bold">Initial Stock</label>
            <input
              type="number"
              id="stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              min="0"
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>

          <div>
            <label htmlFor="minStock" className="block mb-1 font-bold">Minimum Stock</label>
            <input
              type="number"
              id="minStock"
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              min="0"
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
            />
          </div>

          {/* Existing Categories */}
          <div>
            <label htmlFor="category" className="block mb-1 font-bold">Category</label>
            <select
              id="category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : "")}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.kategoriId} value={cat.kategoriId}>
                  {cat.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Upload Product Image */}
          <div>
            <label htmlFor="image" className="block mb-1 font-bold">Product Image</label>
            <input
              type="file"
              id="image"
              onChange={(e) => e.target.files && setImage(e.target.files[0])}
              accept="image/*"
              ref={fileInputRef}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Adding..." : "Add Product"}
          </button>
        </form>
      </div>
      <NeoProgressIndicator isLoading={isLoading} message="Adding new product..." />
    </div>
  );
}
