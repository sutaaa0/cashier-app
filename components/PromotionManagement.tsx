"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Calendar, Tag, Percent, DollarSign } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"

interface Promotion {
  id: number
  name: string
  description: string
  discountType: "percentage" | "fixed"
  discountValue: number
  startDate: string
  endDate: string
  status: "active" | "scheduled" | "expired"
  minimumPurchase?: number
  maximumDiscount?: number
  applicableProducts: "all" | "specific"
  productCategories?: string[]
}

export function PromotionManagement() {
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: 1,
      name: "Diskon Akhir Pekan",
      description: "Diskon 10% untuk semua produk di akhir pekan",
      discountType: "percentage",
      discountValue: 10,
      startDate: "2025-02-01",
      endDate: "2025-02-28",
      status: "active",
      minimumPurchase: 50000,
      maximumDiscount: 100000,
      applicableProducts: "all",
    },
    {
      id: 2,
      name: "Flash Sale Minuman",
      description: "Diskon Rp 5.000 untuk semua minuman",
      discountType: "fixed",
      discountValue: 5000,
      startDate: "2025-02-15",
      endDate: "2025-02-15",
      status: "scheduled",
      applicableProducts: "specific",
      productCategories: ["Minuman"],
    },
  ])

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [newPromotion, setNewPromotion] = useState<Omit<Promotion, "id" | "status">>({
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: 0,
    startDate: "",
    endDate: "",
    applicableProducts: "all",
    minimumPurchase: 0,
    maximumDiscount: 0,
    productCategories: [],
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setNewPromotion((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const now = new Date()
    const startDate = new Date(newPromotion.startDate)
    const endDate = new Date(newPromotion.endDate)

    let status: "active" | "scheduled" | "expired"
    if (now >= startDate && now <= endDate) {
      status = "active"
    } else if (now < startDate) {
      status = "scheduled"
    } else {
      status = "expired"
    }

    const promotionToAdd = {
      ...newPromotion,
      id: Date.now(),
      status,
    }

    setPromotions((prev) => [...prev, promotionToAdd])
    setIsAddModalOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setNewPromotion({
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      startDate: "",
      endDate: "",
      applicableProducts: "all",
      minimumPurchase: 0,
      maximumDiscount: 0,
      productCategories: [],
    })
  }

  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus promosi ini?")) {
      setPromotions((prev) => prev.filter((promo) => promo.id !== id))
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "scheduled":
        return "bg-blue-500"
      case "expired":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black transform -rotate-2">MANAJEMEN PROMOSI</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-[#FFD700] font-bold border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                     hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] 
                     active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all
                     flex items-center gap-2"
        >
          <Plus size={20} />
          Tambah Promosi Baru
        </button>
      </div>

      <div className="grid gap-4">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-white border-3 border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] 
                       transform hover:-rotate-1 transition-transform"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">{promo.name}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-bold text-white ${getStatusBadgeClass(
                      promo.status,
                    )} border-2 border-black transform rotate-2`}
                  >
                    {promo.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-gray-600">{promo.description}</p>
                <div className="flex flex-wrap gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    {promo.discountType === "percentage" ? (
                      <Percent size={16} className="text-blue-500" />
                    ) : (
                      <DollarSign size={16} className="text-green-500" />
                    )}
                    <span className="font-bold">
                      {promo.discountType === "percentage"
                        ? `${promo.discountValue}%`
                        : formatRupiah(promo.discountValue)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={16} className="text-purple-500" />
                    <span>
                      {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  {promo.minimumPurchase && (
                    <div className="flex items-center gap-1">
                      <Tag size={16} className="text-orange-500" />
                      <span>Min. {formatRupiah(promo.minimumPurchase)}</span>
                    </div>
                  )}
                </div>
                {promo.productCategories && promo.productCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {promo.productCategories.map((category) => (
                      <span
                        key={category}
                        className="px-2 py-1 text-sm bg-gray-100 border-2 border-black transform -rotate-1"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingPromotion(promo)}
                  className="p-2 bg-[#FFD700] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                             hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                             active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all
                             transform rotate-2"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="p-2 bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                             hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                             active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all
                             hover:bg-red-500 hover:text-white transform -rotate-2"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah/Edit Promosi */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border-4 border-black p-6 max-w-2xl w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h3 className="text-2xl font-bold mb-4">Tambah Promosi Baru</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-bold mb-1">Nama Promosi</label>
                <input
                  type="text"
                  name="name"
                  value={newPromotion.name}
                  onChange={handleInputChange}
                  className="w-full p-2 border-2 border-black"
                  required
                />
              </div>

              <div>
                <label className="block font-bold mb-1">Deskripsi</label>
                <textarea
                  name="description"
                  value={newPromotion.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border-2 border-black"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Tipe Diskon</label>
                  <select
                    name="discountType"
                    value={newPromotion.discountType}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-black"
                  >
                    <option value="percentage">Persentase</option>
                    <option value="fixed">Nominal Tetap</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold mb-1">Nilai Diskon</label>
                  <input
                    type="number"
                    name="discountValue"
                    value={newPromotion.discountValue}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-black"
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newPromotion.startDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-black"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Tanggal Berakhir</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newPromotion.endDate}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold mb-1">Minimum Pembelian</label>
                  <input
                    type="number"
                    name="minimumPurchase"
                    value={newPromotion.minimumPurchase}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-black"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Maksimum Diskon</label>
                  <input
                    type="number"
                    name="maximumDiscount"
                    value={newPromotion.maximumDiscount}
                    onChange={handleInputChange}
                    className="w-full p-2 border-2 border-black"
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Berlaku Untuk</label>
                <select
                  name="applicableProducts"
                  value={newPromotion.applicableProducts}
                  onChange={handleInputChange}
                  className="w-full p-2 border-2 border-black"
                >
                  <option value="all">Semua Produk</option>
                  <option value="specific">Kategori Tertentu</option>
                </select>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    resetForm()
                  }}
                  className="px-4 py-2 bg-white font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                             hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                             active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#FFD700] font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                             hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                             active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  Simpan Promosi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

