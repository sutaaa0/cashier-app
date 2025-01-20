"use client"

import type React from "react"
import { useState, useRef } from "react"
import { X, Upload } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { addProduct } from "@/server/actions"
import { NeoProgressIndicator } from "../../../../components/NeoProgresIndicator"

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
}

export function AddProductModal({ isOpen, onClose, onProductAdded }: AddProductModalProps) {
  const [productName, setProductName] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [category, setCategory] = useState("")
  const [image, setImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!image) {
      toast({
        title: "Error",
        description: "Please select an image",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", image)

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image")
      }

      const uploadResult = await uploadResponse.json()

      const result = await addProduct({
        name: productName,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock, 10),
        category,
        imageUrl: uploadResult.secure_url,
      })

      if (result.status === "Success") {
        toast({
          title: "Success",
          description: "Product added successfully",
        })
        onClose()
        onProductAdded()
        // Reset form
        setProductName("")
        setPrice("")
        setStock("")
        setCategory("")
        setImage(null)
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  if (!isOpen) return null

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
          <div>
            <label htmlFor="productName" className="block mb-1 font-bold">
              Product Name
            </label>
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
            <label htmlFor="price" className="block mb-1 font-bold">
              Price
            </label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label htmlFor="stock" className="block mb-1 font-bold">
              Initial Stock
            </label>
            <input
              type="number"
              id="stock"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
              min="0"
            />
          </div>
          <div>
            <label htmlFor="category" className="block mb-1 font-bold">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          <div>
            <label htmlFor="image" className="block mb-1 font-bold">
              Product Image
            </label>
            <input
              type="file"
              id="image"
              onChange={handleImageChange}
              className="hidden"
              accept="image/*"
              ref={fileInputRef}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-2 bg-white font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              {image ? "Change Image" : "Upload Image"}
            </button>
            {image && <p className="mt-2 text-sm">{image.name}</p>}
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Add Product
          </button>
        </form>
      </div>
      <NeoProgressIndicator isLoading={isLoading} message="Adding new product..." />
    </div>
  )
}

