"use client"

import { useEffect, useState } from "react"
import { User, Trash2, Edit, Plus, Star, Phone } from "lucide-react"
import { getPelanggan, deletePelanggan, updatePelanggan } from "@/server/actions"
import { toast } from "@/hooks/use-toast"
import type { Pelanggan as PelangganType } from "@prisma/client"
import { DeleteConfirmModal } from "./DeleteConfirmModal"
import { AddCustomerModal } from "./AddCustomerModal"
import { EditCustomerModal } from "./EditCUstomerModal"
import { NeoProgressIndicator } from "./NeoProgresIndicator"

export function CustomerManagement() {
  const [customers, setCustomers] = useState<PelangganType[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<PelangganType | null>(null)

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    setIsLoading(true)
    setLoadingMessage("Fetching customers...")
    try {
      const pelanggan = await getPelanggan()
      if (pelanggan) {
        setCustomers(pelanggan)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch customers",
        variant: "destructive",
      })
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (customer: PelangganType) => {
    setSelectedCustomer(customer)
    setIsDeleteModalOpen(true)
  }

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
      setIsLoading(true)
      setLoadingMessage("Deleting customer...")
      try {
        const deleteResult = await deletePelanggan(selectedCustomer.pelangganId)
        if (deleteResult.status === "Success") {
          toast({
            title: "Success",
            description: "Customer deleted successfully",
          })
          fetchCustomers()
        } else {
          toast({
            title: "Error",
            description: "Failed to delete customer",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error(error)
        toast({
          title: "Error",
          description: "An error occurred while deleting the customer",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
        setIsDeleteModalOpen(false)
        setSelectedCustomer(null)
      }
    }
  }

  const handleEditClick = (customer: PelangganType) => {
    setSelectedCustomer(customer)
    setIsEditModalOpen(true)
  }

  const handleEditCustomer = async (updatedCustomer: PelangganType) => {
    setIsLoading(true)
    setLoadingMessage("Updating customer...")
    try {
      // Implement updatePelanggan action in server/actions.ts
      const result = await updatePelanggan(updatedCustomer)
      if (result.status === "Success") {
        toast({
          title: "Success",
          description: "Customer updated successfully",
        })
        fetchCustomers()
        setIsEditModalOpen(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to update customer",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "An error occurred while updating the customer",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">CUSTOMER MANAGEMENT</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Add New Customer
        </button>
      </div>
      <div className="grid gap-4">
        {customers.map((customer) => (
          <div
            key={customer.pelangganId}
            className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#93B8F3] border-[3px] border-black transform rotate-3">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{customer.nama}</h3>
                  <p className="text-sm">{customer.alamat}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center px-2 py-1 bg-[#FFD700] border-[3px] border-black text-sm font-bold transform -rotate-2">
                      <Phone size={16} className="mr-1" />
                      {customer.nomorTelepon}
                    </span>
                    <span className="inline-block px-2 py-1 bg-black text-white text-sm transform rotate-1">
                      Join: {new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 bg-[#93B8F3] border-[3px] border-black text-sm font-bold transform -rotate-1">
                      <Star size={16} className="mr-1" />
                      {customer.points} points
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditClick(customer)}
                  className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all transform rotate-2"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDeleteClick(customer)}
                  className="p-2 bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all hover:bg-red-500 hover:text-white transform -rotate-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <AddCustomerModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCustomerAdded={() => {
          setIsLoading(true)
          setLoadingMessage("Adding new customer...")
          fetchCustomers()
        }}
      />
      {selectedCustomer && (
        <EditCustomerModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          customer={selectedCustomer}
          onEditCustomer={handleEditCustomer}
        />
      )}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteCustomer}
        itemName={selectedCustomer?.nama || ""}
        subject="Customer"
      />
      <NeoProgressIndicator isLoading={isLoading} message={loadingMessage} />
    </div>
  )
}

