"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "@/hooks/use-toast"
import { addCategory } from "@/server/actions"
import { X, Upload } from "lucide-react"
import { NeoProgressIndicator } from "@/components/NeoProgresIndicator"

interface AddCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoryAdded: () => void
}

export function AddCategoryModal({ isOpen, onClose, onCategoryAdded }: AddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal is closed
  const handleClose = () => {
    setCategoryName("")
    setIconFile(null)
    onClose()
  }

  // Reset form when isOpen changes from true to false
  useEffect(() => {
    if (!isOpen) {
      setCategoryName("")
      setIconFile(null)
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Enhanced validation for category name
    if (!categoryName.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Category name cannot be empty", 
        variant: "destructive" 
      })
      return
    }

    // Added validation for icon file
    if (!iconFile) {
      toast({ 
        title: "Validation Error", 
        description: "Please upload a category icon", 
        variant: "destructive" 
      })
      return
    }

    setIsLoading(true)

    try {
      let iconUrl = ""

      if (iconFile) {
        const formData = new FormData()
        formData.append("file", iconFile)
        const uploadResponse = await fetch("/api/upload", { 
          method: "POST", 
          body: formData 
        })
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload icon")
        }
        
        const uploadResult = await uploadResponse.json()
        iconUrl = uploadResult.secure_url
      }

      const result = await addCategory({ nama: categoryName, icon: iconUrl })

      if (result.status === "Success") {
        toast({ 
          title: "Success", 
          description: "Category added successfully" 
        })
        handleClose()
        onCategoryAdded()
      } else {
        toast({ 
          title: "Error", 
          description: result.message || "Failed to add category", 
          variant: "destructive" 
        })
      }
    } catch (error) {
      console.error(error)
      toast({ 
        title: "Error", 
        description: "An error occurred while adding the category", 
        variant: "destructive" 
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black transform -rotate-2">ADD NEW CATEGORY</h2>
          <button
            onClick={handleClose}
            className="p-2 bg-[#F44336] text-white font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                       hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="categoryName" className="block mb-2 text-xl font-bold">
              Category Name
            </label>
            <input
              type="text"
              id="categoryName"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="w-full p-3 text-lg border-4 border-black focus:outline-none focus:ring-4 focus:ring-[#FFD700]"
              placeholder="Enter category name"
              required
            />
          </div>

          <div>
            <label htmlFor="icon" className="block mb-2 text-xl font-bold">
              Category Icon <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="icon"
              accept="image/*"
              onChange={(e) => e.target.files && setIconFile(e.target.files[0])}
              ref={fileInputRef}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-full px-4 py-3 ${iconFile ? 'bg-green-100' : 'bg-[#FFD700]'} text-lg font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                         hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all
                         flex items-center justify-center gap-2`}
            >
              <Upload size={24} />
              {iconFile ? "Change Icon" : "Upload Icon"}
            </button>
            {iconFile ? (
              <p className="mt-2 text-sm font-bold text-green-600">✓ {iconFile.name}</p>
            ) : (
              <p className="mt-2 text-sm text-red-500">This field is required</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-3 bg-[#4CAF50] text-white text-xl font-bold border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                       hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
           Add Category
          </button>
        </form>
      </div>
      <NeoProgressIndicator isLoading={isLoading} message="Adding new category..." />
    </div>
  )
}