"use client"

import { useState } from 'react'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { createCustomer, getCustomers } from "@/server/actions"
import { toast } from "@/hooks/use-toast"

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Define the form schema with Zod
const customerFormSchema = z.object({
  name: z.string().min(1, { message: "Nama diperlukan" }),
  address: z.string().min(1, { message: "Alamat diperlukan" }),
  phoneNumber: z.string()
    .min(1, { message: "Nomor telepon diperlukan" })
    .regex(/^08[0-9]{8,10}$/, { 
      message: "Format nomor telepon tidak valid (gunakan format: 08xxxxxxxxxx)" 
    })
})

// Type for the form values
type CustomerFormValues = z.infer<typeof customerFormSchema>

interface CustomerInputProps {
  onSubmit: (customerData: { pelangganId?: number; guestId?: number; nama?: string; alamat?: string | null; nomorTelepon?: string | null }) => void
  onCancel: () => void
}

export function CustomerInputForm({ onSubmit, onCancel }: CustomerInputProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState<Array<{ pelangganId: number; nama: string; alamat: string | null; nomorTelepon: string | null }>>([])
  
  // Define form with React Hook Form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: ""
    },
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Warning",
        description: "Masukkan kata kunci pencarian terlebih dahulu ",
        variant: "destructive",
      })
      return
    }
    
    setIsLoading(true)
    try {
      const result = await getCustomers(searchQuery)
      setCustomers(result)
      
      if (result.length === 0) {
        toast({
          title: "Info",
          description: "Tidak ada pelanggan yang ditemukan",
        })
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Gagal menemukan pelanggan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onFormSubmit = async (data: CustomerFormValues) => {
    setIsLoading(true)
    
    try {
      const result = await createCustomer({ 
        nama: data.name, 
        alamat: data.address, 
        nomorTelepon: data.phoneNumber 
      })

      // Check if result is undefined, which would indicate a server error
      if (!result) {
        throw new Error("Server error - no response received")
      }

      if (result.status === "Success") {
        toast({
          title: "Success",
          description: "Data pelanggan berhasil disimpan",
        })
        if (result.data) {
          onSubmit(result.data)
        } else {
          toast({
            title: "Warning",
            description: "Data pelanggan tersimpan tetapi ada informasi yang tidak lengkap",
            variant: "destructive",
          })
          onSubmit({ nama: data.name, alamat: data.address, nomorTelepon: data.phoneNumber })
        }
      } else {
        // Handle error from server action
        console.log("Server returned error:", result)
        
        // Display specific error message if phone number already exists
        if (result.message && result.message.includes("duplicate")) {
          toast({
            title: "Error",
            description: "Nomor telepon sudah terdaftar",
            variant: "destructive",
          })
          form.setError("phoneNumber", { 
            type: "manual", 
            message: "Nomor telepon sudah terdaftar" 
          })
        } else {
          // Handle other error types
          toast({
            title: "Error",
            description: result.message || "Failed to save customer data",
            variant: "destructive",
          })
        }
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      
      // Improved error handling with more specific messages
      const errorMessage = "Failed to save member data"
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestPurchase = () => {
    onSubmit({ guestId: undefined, nama: "Guest" })
  }

  return (
    <div className="bg-white border-4 border-black p-4 font-mono">
      <div className="mb-4">
        <label htmlFor="search" className="block mb-2 font-bold">Cari Member</label>
        <div className="flex gap-2">
          <Input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter name or phone number "
            disabled={isLoading}
            className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Search..." : "Search"}
          </Button>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="mb-4 border-2 border-black p-2">
          <h3 className="text-lg font-bold mb-2">Hasil Pencarian</h3>
          <ul className="space-y-2">
            {customers.map((customer) => (
              <li 
                key={customer.pelangganId} 
                onClick={() => onSubmit(customer)}
                className="cursor-pointer hover:bg-[#FFD700] p-2 transition-colors"
              >
                {customer.nama} - {customer.nomorTelepon}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">
                  Nama <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Masukan nama"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">
                  Alamat <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Masukan alamat"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-bold">
                 Nomor Telepon <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Format: 08xxxxxxxxxx"
                    disabled={isLoading}
                    className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
                  />
                </FormControl>
                <FormDescription>
                Masukkan nomor telepon dengan format 08xxxxxxxxxx 
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              onClick={onCancel}
              disabled={isLoading}
              variant="default"
              className="px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Batal 
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-4">
        <Button 
          onClick={handleGuestPurchase} 
          className="w-full px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-[#FFD700] transition-colors"
        >
          Lanjut Sebagai Guest
        </Button>
      </div>
    </div>
  )
}