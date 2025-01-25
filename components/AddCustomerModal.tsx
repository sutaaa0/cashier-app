"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { addPelanggan } from "@/server/actions"
import { NeoProgressIndicator } from "./NeoProgresIndicator"

interface AddCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onCustomerAdded: () => void
}

export function AddCustomerModal({ isOpen, onClose, onCustomerAdded }: AddCustomerModalProps) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await addPelanggan({
        nama: name,
        alamat: address,
        nomorTelepon: phoneNumber,
      })

      if (result.status === "Success") {
        toast({
          title: "Success",
          description: "Customer added successfully",
        })
        onClose()
        onCustomerAdded()
        // Reset form
        setName("")
        setAddress("")
        setPhoneNumber("")
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "Failed to add customer",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add New Customer</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block mb-1 font-bold">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          <div>
            <label htmlFor="address" className="block mb-1 font-bold">
              Address
            </label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          <div>
            <label htmlFor="phoneNumber" className="block mb-1 font-bold">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            Add Customer
          </button>
        </form>
      </div>
      <NeoProgressIndicator isLoading={isLoading} message="Adding new customer..." />
    </div>
  )
}

