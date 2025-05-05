"use client";

import { useEffect, useState, useMemo } from "react";
import { User, Trash2, Edit, Plus, Star, Phone, Search } from "lucide-react";
import { getPelanggan, deletePelanggan, updatePelanggan } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import type { Pelanggan as PelangganType } from "@prisma/client";
import { DeleteConfirmModal } from "./DeleteConfirmModal";
import { AddCustomerModal } from "./AddCustomerModal";
import { EditCustomerModal } from "./EditCUstomerModal";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

export function CustomerManagement() {
  const [originalCustomers, setOriginalCustomers] = useState<PelangganType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<PelangganType | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    setLoadingMessage("Loading member...");
    try {
      const pelanggan = await getPelanggan();
      if (pelanggan) {
        setOriginalCustomers(pelanggan);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mengambil member",
        variant: "destructive",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter customers based on search term
  const customers = useMemo(() => {
    if (!searchTerm) return originalCustomers;

    const searchTermLower = searchTerm.toLowerCase();
    return originalCustomers.filter(
      (customer) =>
        customer.nama.toLowerCase().includes(searchTermLower) ||
        (customer.alamat && customer.alamat.toLowerCase().includes(searchTermLower)) ||
        (customer.nomorTelepon && customer.nomorTelepon.toLowerCase().includes(searchTermLower)) ||
        customer.points.toString().includes(searchTermLower)
    );
  }, [originalCustomers, searchTerm]);

  const handleDeleteClick = (customer: PelangganType) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCustomer = async () => {
    if (selectedCustomer) {
      setIsLoading(true);
      setLoadingMessage("Deleting customer...");
      try {
        const deleteResult = await deletePelanggan(selectedCustomer.pelangganId);
        if (deleteResult.status === "Success") {
          toast({
            title: "Berhasil",
            description: "Member berhasil dihapus",
          });
          fetchCustomers();
        } else {
          toast({
            title: "Error",
            description: "Gagal menghapus member",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat menghapus member",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsDeleteModalOpen(false);
        setSelectedCustomer(null);
      }
    }
  };

  const handleEditClick = (customer: PelangganType) => {
    setSelectedCustomer(customer);
    setIsEditModalOpen(true);
  };

  const handleEditCustomer = async (updatedCustomer: PelangganType) => {
    setIsLoading(true);
    setLoadingMessage("Memperbarui member...");
    try {
      const result = await updatePelanggan(updatedCustomer);
      if (result.status === "Success") {
        toast({
          title: "Berhasil",
          description: "Member berhasil diperbarui",
        });
        fetchCustomers();
        setIsEditModalOpen(false);
      } else {
        toast({
          title: "Error",
          description: "Gagal memperbarui member",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat memperbarui member",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">MANAJEMEN MEMBER</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
        >
          <Plus size={20} />
          Tambahkan Member Baru
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Cari member berdasarkan nama, telepon, alamat, atau poin"
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-2 border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
        />
        <Search size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
      </div>

      <div className="grid gap-4">
        {customers.length === 0 && !isLoading && (
          <div className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="text-center text-gray-500">{searchTerm ? `Tidak ada member yang ditemukan untuk "${searchTerm}"` : "Tidak ada member yang ditemukan"}</p>
          </div>
        )}

        {customers.map((customer) => (
          <div key={customer.pelangganId} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform">
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
                    <span className="inline-block px-2 py-1 bg-black text-white text-sm transform rotate-1">Bergabung: {new Date(customer.createdAt).toLocaleDateString()}</span>
                    <span className="inline-flex items-center px-2 py-1 bg-[#93B8F3] border-[3px] border-black text-sm font-bold transform -rotate-1">
                      <Star size={16} className="mr-1" />
                      {customer.points} point
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
          setIsLoading(true);
          setLoadingMessage("Menambahkan member baru...");
          fetchCustomers();
        }}
      />
      {selectedCustomer && <EditCustomerModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} customer={selectedCustomer} onEditCustomer={handleEditCustomer} />}
      <DeleteConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteCustomer} itemName={selectedCustomer?.nama || ""} subject="Member" />
      <NeoProgressIndicator isLoading={isLoading} message={loadingMessage} />
    </div>
  );
}
