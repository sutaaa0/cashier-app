// components/AddPromotionModal.tsx
"use client"

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { createPromotion } from '@/server/actions';

interface AddPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPromotionCreated: () => void;
}

export function AddPromotionModal({ isOpen, onClose, onPromotionCreated }: AddPromotionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('FLASH_SALE');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [applicableProducts, setApplicableProducts] = useState('all');
  const [productCategories, setProductCategories] = useState('');
  const [minQuantity, setMinQuantity] = useState<number | ''>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Mapping nilai diskon ke discountPercentage atau discountAmount
      const discountPercentage = discountType === 'percentage' ? discountValue : undefined;
      const discountAmount = discountType === 'fixed' ? discountValue : undefined;

      await createPromotion({
        title,
        description,
        type: type as "FLASH_SALE" | "SPECIAL_DAY" | "WEEKEND" | "PRODUCT_SPECIFIC" | "QUANTITY_BASED",
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        discountPercentage,
        discountAmount,
        minQuantity: minQuantity === '' ? undefined : Number(minQuantity),
        applicableProducts: applicableProducts as "all" | "specific",
        productCategories: applicableProducts === 'specific'
          ? productCategories.split(',').map((cat) => cat.trim())
          : [],
      });

      toast({
        title: "Berhasil",
        description: "Promosi berhasil ditambahkan",
      });
      onPromotionCreated();
      onClose();
      // Reset form
      setTitle('');
      setDescription('');
      setType('FLASH_SALE');
      setDiscountType('percentage');
      setDiscountValue(0);
      setStartDate('');
      setEndDate('');
      setApplicableProducts('all');
      setProductCategories('');
      setMinQuantity('');
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Gagal menambahkan promosi",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tambah Promosi Baru</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block mb-1 font-bold">Judul Promosi</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block mb-1 font-bold">Deskripsi</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="type" className="block mb-1 font-bold">Tipe Promosi</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            >
              <option value="FLASH_SALE">Flash Sale</option>
              <option value="SPECIAL_DAY">Hari Spesial</option>
              <option value="WEEKEND">Akhir Pekan</option>
              <option value="PRODUCT_SPECIFIC">Produk Tertentu</option>
              <option value="QUANTITY_BASED">Berdasarkan Kuantitas</option>
            </select>
          </div>
          <div>
            <label htmlFor="discountType" className="block mb-1 font-bold">Tipe Diskon</label>
            <select
              id="discountType"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            >
              <option value="percentage">Persentase</option>
              <option value="fixed">Nominal Tetap</option>
            </select>
          </div>
          <div>
            <label htmlFor="discountValue" className="block mb-1 font-bold">Nilai Diskon</label>
            <input
              type="number"
              id="discountValue"
              value={discountValue}
              onChange={(e) => setDiscountValue(Number(e.target.value))}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="startDate" className="block mb-1 font-bold">Tanggal Mulai</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block mb-1 font-bold">Tanggal Berakhir</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            />
          </div>
          <div>
            <label htmlFor="applicableProducts" className="block mb-1 font-bold">Berlaku Untuk</label>
            <select
              id="applicableProducts"
              value={applicableProducts}
              onChange={(e) => setApplicableProducts(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
              required
            >
              <option value="all">Semua Produk</option>
              <option value="specific">Kategori Tertentu</option>
            </select>
          </div>
          {applicableProducts === "specific" && (
            <div>
              <label htmlFor="productCategories" className="block mb-1 font-bold">Kategori Produk</label>
              <input
                type="text"
                id="productCategories"
                value={productCategories}
                onChange={(e) => setProductCategories(e.target.value)}
                className="w-full p-2 border-[3px] border-black rounded"
                placeholder="Pisahkan dengan koma"
                required
              />
            </div>
          )}
          <div>
            <label htmlFor="minQuantity" className="block mb-1 font-bold">
              Minimum Pembelian (untuk promosi berbasis kuantitas)
            </label>
            <input
              type="number"
              id="minQuantity"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              className="w-full p-2 border-[3px] border-black rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            Tambah Promosi
          </button>
        </form>
      </div>
    </div>
  );
}
