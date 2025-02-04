"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { toast } from "@/hooks/use-toast"
import Image from "next/image"
import { Plus, Save, X, Edit, Trash2 } from "lucide-react"
import { fetchCategories, updateCategory, } from "@/server/actions"
import { NeoProgressIndicator } from "./NeoProgresIndicator"
import { AddCategoryModal } from "@/app/(administrator)/dashboard-admin/components/AddCategoryModal"

interface Category {
  kategoriId: number
  nama: string
  icon: string
}

export function CategoryManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newIconFile, setNewIconFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadCategories = async () => {
    setIsLoading(true)
    try {
      const response = await fetchCategories()
      if (response.status === "Success" && response.data) {
        setCategories(response.data)
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to fetch categories", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, []) //Fixed: Added empty dependency array to useEffect

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewIconFile(e.target.files[0])
    }
  }

  const handleSaveCategory = async (categoryToUpdate: Category) => {
    setIsLoading(true)
    try {
      let iconUrl = categoryToUpdate.icon
      if (newIconFile) {
        const formData = new FormData()
        formData.append("file", newIconFile)
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload category icon")
        }
        const uploadResult = await uploadResponse.json()
        iconUrl = uploadResult.secure_url
      }

      const updateResponse = await updateCategory({
        kategoriId: categoryToUpdate.kategoriId,
        nama: categoryToUpdate.nama,
        icon: iconUrl,
      })

      if (updateResponse.status === "Success") {
        toast({ title: "Success", description: "Category updated successfully" })
        setEditingCategory(null)
        setNewIconFile(null)
        loadCategories()
      } else {
        toast({
          title: "Error",
          description: updateResponse.message || "Failed to update category",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

//   const handleDeleteCategory = async (categoryId: number) => {
//     if (window.confirm("Are you sure you want to delete this category?")) {
//       setIsLoading(true)
//       try {
//         const deleteResponse = await deleteCategory(categoryId)
//         if (deleteResponse.status === "Success") {
//           toast({ title: "Success", description: "Category deleted successfully" })
//           loadCategories()
//         } else {
//           toast({
//             title: "Error",
//             description: deleteResponse.message || "Failed to delete category",
//             variant: "destructive",
//           })
//         }
//       } catch (error) {
//         console.error(error)
//         toast({ title: "Error", description: "Failed to delete category", variant: "destructive" })
//       } finally {
//         setIsLoading(false)
//       }
//     }
//   }

  return (
    <div className="p-6 bg-[#F3F3F3] min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-4xl font-black transform -rotate-2">CATEGORY MANAGEMENT</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#FFD700] font-bold text-lg border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                     hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none
                     transition-all flex items-center gap-2"
        >
          <Plus size={24} />
          Add Category
        </button>
      </div>

      {isLoading && <NeoProgressIndicator isLoading={isLoading} message="Loading categories..." />}

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
                        const newName = e.target.value
                        setCategories((prev) =>
                          prev.map((c) => (c.kategoriId === cat.kategoriId ? { ...c, nama: newName } : c)),
                        )
                      }}
                      className="border-4 border-black p-2 text-xl font-bold focus:outline-none focus:ring-4 focus:ring-[#FFD700]"
                    />
                    <div className="flex items-center gap-4">
                      {cat.icon ? (
                        <Image
                          src={cat.icon || "/placeholder.svg"}
                          alt={cat.nama}
                          width={60}
                          height={60}
                          className="border-4 border-black"
                        />
                      ) : (
                        <div className="w-[60px] h-[60px] bg-gray-300 border-4 border-black flex items-center justify-center font-bold">
                          No Icon
                        </div>
                      )}
                      <input
                        type="file"
                        onChange={handleIconChange}
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#FFD700] font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                   hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                      >
                        Change Icon
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      {cat.icon ? (
                        <Image
                          src={cat.icon || "/placeholder.svg"}
                          alt={cat.nama}
                          width={60}
                          height={60}
                          className="border-4 border-black"
                        />
                      ) : (
                        <div className="w-[60px] h-[60px] bg-gray-300 border-4 border-black flex items-center justify-center font-bold">
                          No Icon
                        </div>
                      )}
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
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCategory(null)}
                      className="p-3 bg-[#F44336] text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                    >
                      <X size={24} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setEditingCategory(cat)}
                      className="p-3 bg-[#2196F3] text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                                 hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
                    >
                      <Edit size={24} />
                    </button>
                    <button
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

      <AddCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCategoryAdded={loadCategories} />
    </div>
  )
}

