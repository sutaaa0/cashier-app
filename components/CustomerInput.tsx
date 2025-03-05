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
  
  // Add validation state
  const [errors, setErrors] = useState({
    name: '',
    address: '',
    phoneNumber: ''
  })

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Peringatan",
        description: "Masukkan kata kunci pencarian terlebih dahulu",
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
        description: "Gagal mencari pelanggan",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Validate phone number format
  const validatePhoneNumber = (phone: string): boolean => {
    // Indonesian phone format: starts with 0 or +62, followed by 9-12 digits
    const phoneRegex = /^(\+62|0)[0-9]{9,12}$/
    return phoneRegex.test(phone)
  }

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors = {
      name: '',
      address: '',
      phoneNumber: ''
    }
    
    let isValid = true
    
    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Nama harus diisi'
      isValid = false
    }
    
    // Validate address
    if (!address.trim()) {
      newErrors.address = 'Alamat harus diisi'
      isValid = false
    }
    
    // Validate phone number
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Nomor telepon harus diisi'
      isValid = false
    } else if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Format nomor telepon tidak valid (gunakan format: 08xxxxxxxxxx atau +62xxxxxxxxxx)'
      isValid = false
    }
    
    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form
    if (!validateForm()) {
      return
    }
    
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
        // Display specific error message if phone number already exists
        if (result.message && result.message.includes("duplicate")) {
          toast({
            title: "Error",
            description: "Nomor telepon sudah terdaftar",
            variant: "destructive",
          })
          setErrors(prev => ({
            ...prev,
            phoneNumber: 'Nomor telepon sudah digunakan'
          }))
        } else {
          throw new Error(result.message)
        }
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
          <label htmlFor="name" className="block mb-2 font-bold">Nama <span className="text-red-500">*</span></label>
          <input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              if (e.target.value.trim()) {
                setErrors(prev => ({ ...prev, name: '' }))
              }
            }}
            required
            disabled={isLoading}
            className={`w-full px-4 py-2 border-2 ${errors.name ? 'border-red-500 bg-red-50' : 'border-black'} focus:outline-none focus:ring-2 focus:ring-[#FFD700]`}
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="address" className="block mb-2 font-bold">Alamat <span className="text-red-500">*</span></label>
          <input
            id="address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value)
              if (e.target.value.trim()) {
                setErrors(prev => ({ ...prev, address: '' }))
              }
            }}
            required
            disabled={isLoading}
            className={`w-full px-4 py-2 border-2 ${errors.address ? 'border-red-500 bg-red-50' : 'border-black'} focus:outline-none focus:ring-2 focus:ring-[#FFD700]`}
          />
          {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block mb-2 font-bold">Nomor Telepon <span className="text-red-500">*</span></label>
          <input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value)
              if (e.target.value.trim()) {
                setErrors(prev => ({ ...prev, phoneNumber: '' }))
              }
            }}
            placeholder="Format: 08xxxxxxxxxx atau +62xxxxxxxxxx"
            required
            disabled={isLoading}
            className={`w-full px-4 py-2 border-2 ${errors.phoneNumber ? 'border-red-500 bg-red-50' : 'border-black'} focus:outline-none focus:ring-2 focus:ring-[#FFD700]`}
          />
          {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
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