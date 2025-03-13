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
  name: z.string().min(1, { message: "Name required" }),
  address: z.string().min(1, { message: "Address required" }),
  phoneNumber: z.string()
    .min(1, { message: "Phone number required" })
    .regex(/^08[0-9]{8,10}$/, { 
      message: "Invalid phone number format (use format: 08xxxxxxxxxx)" 
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
        description: "Enter search keywords first ",
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
          description: "No customer found",
        })
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Failure to find customers",
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
          description: "Customer data saved successfully",
        })
        if (result.data) {
          onSubmit(result.data)
        } else {
          toast({
            title: "Warning",
            description: "Customer data is saved but there is incomplete information",
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
            description: "Phone number already registered ",
            variant: "destructive",
          })
          form.setError("phoneNumber", { 
            type: "manual", 
            message: "Phone number already in use" 
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
        <label htmlFor="search" className="block mb-2 font-bold">Search Members</label>
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
          <h3 className="text-lg font-bold mb-2">Search Results</h3>
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
                    placeholder="Enter name"
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
                    placeholder="Enter address"
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
                 Phone Number <span className="text-red-500">*</span>
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
                Enter the phone number with the format 08xxxxxxxxxx 
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
              Cancel 
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Keeping..." : "Save"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-4">
        <Button 
          onClick={handleGuestPurchase} 
          className="w-full px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-[#FFD700] transition-colors"
        >
          Continue as Guest 
        </Button>
      </div>
    </div>
  )
}