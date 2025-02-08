"use client"

import { useState } from 'react'
import { createCustomer, getCustomers } from "@/server/actions"
import { toast } from "@/hooks/use-toast"

interface CustomerInputProps {
  onSubmit: (customerData: { pelangganId?: number; guestId?: number; nama?: string; alamat?: string | null; nomorTelepon?: string | null }) => void
  onCancel: () => void
}

export function NeoCustomerInput({ onSubmit, onCancel }: CustomerInputProps) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [customers, setCustomers] = useState<Array<{ pelangganId: number; nama: string; alamat: string | null; nomorTelepon: string | null }>>([])

  const handleSearch = async () => {
    setIsLoading(true)
    try {
      const result = await getCustomers(searchQuery)
      setCustomers(result)
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Gagal mencari pelanggan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const result = await createCustomer({ 
        nama: name, 
        alamat: address, 
        nomorTelepon: phoneNumber 
      })

      if (result.status === "Success") {
        toast({
          title: "Berhasil",
          description: "Data pelanggan berhasil disimpan",
        })
        if (result.data) {
          onSubmit(result.data)
        } else {
          throw new Error("Invalid customer data")
        }
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data pelanggan",
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
          <input
            id="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Masukkan nama atau nomor telepon"
            disabled={isLoading}
            className="flex-1 px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
          <button 
            onClick={handleSearch} 
            disabled={isLoading}
            className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Mencari..." : "Cari"}
          </button>
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-2 font-bold">Nama</label>
          <input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
        </div>
        <div>
          <label htmlFor="address" className="block mb-2 font-bold">Alamat</label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            disabled={isLoading}
            className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block mb-2 font-bold">Nomor Telepon</label>
          <input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            required
            disabled={isLoading}
            className="w-full px-4 py-2 border-2 border-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Batal
          </button>
          <button 
            type="submit" 
            disabled={isLoading}
            className="px-4 py-2 bg-[#FFD700] text-black font-bold border-2 border-black hover:bg-black hover:text-[#FFD700] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
      <div className="mt-4">
        <button 
          onClick={handleGuestPurchase} 
          className="w-full px-4 py-2 bg-white text-black font-bold border-2 border-black hover:bg-[#FFD700] transition-colors"
        >
          Lanjutkan sebagai Guest
        </button>
      </div>
    </div>
  )
}

