"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import Image from "next/image";
import { Plus, Save, X, Edit, Trash2 } from "lucide-react";
import { deleteCategory, fetchCategories, updateCategory } from "@/server/actions";
import { NeoProgressIndicator } from "./NeoProgresIndicator";
import { AddCategoryModal } from "@/app/(administrator)/dashboard-admin/components/AddCategoryModal";
import { DeleteConfirmModal } from "./DeleteConfirmModal";

interface Category {
  kategoriId: number;
  nama: string;
  icon: string;
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [originalCategories, setOriginalCategories] = useState<Category[]>([]); // Store original state
  const [iconPreview, setIconPreview] = useState<{ [key: number]: string }>({});
  const [newIconFile, setNewIconFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Loading kategori...");

  const loadCategories = async () => {
    setIsLoading(true);
    setLoadingMessage("Loading kategori...");
    try {
      const response = await fetchCategories();
      if (response.status === "Success" && response.data) {
        const formattedCategories = response.data.map((cat: { kategoriId: number; nama: string; icon?: string }) => ({
          kategoriId: cat.kategoriId,
          nama: cat.nama,
          icon: cat.icon || "/placeholder.svg",
        }));
        setCategories(formattedCategories);
        setOriginalCategories(JSON.parse(JSON.stringify(formattedCategories))); // Deep copy
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Gagal mengambil kategori", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>, categoryId: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewIconFile(file);

      // Create an object URL for preview
      const objectUrl = URL.createObjectURL(file);
      setIconPreview((prev) => ({
        ...prev,
        [categoryId]: objectUrl,
      }));
    }
  };

  const handleEditClick = (category: Category) => {
    // Save current state before editing
    setOriginalCategories(JSON.parse(JSON.stringify(categories)));
    setEditingCategory(category);
    // Reset any previous icon preview
    setIconPreview((prev) => ({
      ...prev,
      [category.kategoriId]: category.icon,
    }));
  };

  const handleCancelEdit = () => {
    // Restore original state when canceling edit
    setCategories(JSON.parse(JSON.stringify(originalCategories)));
    setEditingCategory(null);
    setNewIconFile(null);

    // Clean up any object URLs to prevent memory leaks
    if (editingCategory) {
      if (iconPreview[editingCategory.kategoriId] && iconPreview[editingCategory.kategoriId].startsWith("blob:")) {
        URL.revokeObjectURL(iconPreview[editingCategory.kategoriId]);
      }
      setIconPreview((prev) => {
        const newPreview = { ...prev };
        delete newPreview[editingCategory.kategoriId];
        return newPreview;
      });
    }
  };

  const handleSaveCategory = async (categoryToUpdate: Category) => {
    // Improved validation: check if category name is empty or only contains whitespace
    if (!categoryToUpdate.nama.trim()) {
      toast({ title: "Kesalahan Validasi", description: "Nama kategori tidak boleh kosong", variant: "destructive" });
      return;
    }

    // Validation: Make sure an icon is provided
    // If there's no new file uploaded and the current icon is a placeholder, show error
    if (!newIconFile && (!categoryToUpdate.icon || categoryToUpdate.icon === "/placeholder.svg")) {
      toast({ title: "Kesalahan Validasi", description: "Silakan unggah ikon kategori", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Memperbarui kategori...");
    try {
      let iconUrl = categoryToUpdate.icon;
      if (newIconFile) {
        const formData = new FormData();
        formData.append("file", newIconFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Gagal mengunggah ikon kategori");
        }

        const uploadResult = await uploadResponse.json();
        iconUrl = uploadResult.secure_url;
      }

      const updateResponse = await updateCategory({
        kategoriId: categoryToUpdate.kategoriId,
        nama: categoryToUpdate.nama,
        icon: iconUrl,
      });

      if (updateResponse.status === "Success") {
        toast({ title: "Berhasil", description: "Kategori berhasil diperbarui" });

        // Clean up any object URLs
        if (iconPreview[categoryToUpdate.kategoriId] && iconPreview[categoryToUpdate.kategoriId].startsWith("blob:")) {
          URL.revokeObjectURL(iconPreview[categoryToUpdate.kategoriId]);
        }

        setEditingCategory(null);
        setNewIconFile(null);
        setIconPreview({});
        loadCategories(); // Reload categories to get updated data
      } else {
        toast({
          title: "Error",
          description: updateResponse.message || "Gagal memperbarui kategori",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Terjadi kesalahan saat memperbarui kategori", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCategory = async () => {
    if (selectedCategory) {
      setIsLoading(true);
      setLoadingMessage("Deleting category...");
      try {
        const deleteResponse = await deleteCategory(selectedCategory.kategoriId);
        if (deleteResponse.status === "Success") {
          toast({ title: "Berhasil", description: "Kategori berhasil dihapus" });
          loadCategories();
        } else {
          toast({
            title: "Error",
            description: deleteResponse.message || "Gagal menghapus kategori",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Terjadi kesalahan saat menghapus kategori", variant: "destructive" });
      } finally {
        setIsLoading(false);
        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
      }
    }
  };

  // Use effect to clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      // Clean up all object URLs
      Object.values(iconPreview).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  return (
    <div className="p-6 bg-[#F3F3F3] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black transform -rotate-2">MANAJEMEN KATEGORI</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#FFD700] font-bold text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                     hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none
                     transition-all flex items-center gap-2"
        >
          <Plus size={24} />
          Tambah Kategori
        </button>
      </div>

      {isLoading && <NeoProgressIndicator isLoading={isLoading} message={loadingMessage} />}

      <div className="space-y-6">
        {categories.map((cat) => (
          <div
            key={cat.kategoriId}
            className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] 
                       transition-all hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       hover:translate-x-[4px] hover:translate-y-[4px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {editingCategory?.kategoriId === cat.kategoriId ? (
                  <>
                    <input
                      type="text"
                      value={cat.nama}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setCategories((prev) => prev.map((c) => (c.kategoriId === cat.kategoriId ? { ...c, nama: newName } : c)));
                      }}
                      className="border-4 border-black p-2 text-xl font-bold focus:outline-none focus:ring-4 focus:ring-[#FFD700]"
                    />
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Image src={iconPreview[cat.kategoriId] || cat.icon || "/placeholder.svg"} alt={cat.nama} width={60} height={60} className="border-4 border-black" />
                        {newIconFile && <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-1 rounded-full border-2 border-black">BARU</div>}
                      </div>
                      <input type="file" onChange={(e) => handleIconChange(e, cat.kategoriId)} accept="image/*" ref={fileInputRef} className="hidden" />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#FFD700] font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                   hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                      >
                        Ubah Ikon
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      <Image src={cat.icon || "/placeholder.svg"} alt={cat.nama} width={60} height={60} className="border-4 border-black" />
                      <span className="text-2xl font-bold">{cat.nama}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                {editingCategory?.kategoriId === cat.kategoriId ? (
                  <>
                    <button
                      onClick={() => handleSaveCategory(cat)}
                      className="p-3 bg-[#4CAF50] text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all
                                 flex items-center gap-2"
                    >
                      <Save size={24} />
                      Simpan
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="p-3 bg-[#F44336] text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                    >
                      <X size={24} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEditClick(cat)}
                      className="p-3 bg-[#2196F3] text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                    >
                      <Edit size={24} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(cat)}
                      className="p-3 bg-[#F44336] text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                    >
                      <Trash2 size={24} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteCategory} itemName={selectedCategory?.nama || ""} subject="Kategori" />

      <AddCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCategoryAdded={loadCategories} />
    </div>
  );
}
