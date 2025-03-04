"use client";

import React, { useState, useEffect } from "react";
import { formatRupiah } from "@/lib/formatIdr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PromotionType } from "@prisma/client";
import { MultiSelect } from "./Multiselect";
import { PromotionFormProps } from "@/types/promotion"; // Import the type

const PromotionForm: React.FC<PromotionFormProps> = ({ 
  formData, 
  setFormData, 
  products, 
  isPending, 
  onSubmit, 
  onCancel 
}) => {
  // State to track validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Clear errors when form data changes
  useEffect(() => {
    setErrors({});
  }, [formData]);

  // Validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Required text fields
    if (!formData.title.trim()) {
      newErrors.title = "Judul promosi harus diisi";
    }
    
    // Date validation
    if (!formData.startDate) {
      newErrors.startDate = "Tanggal mulai harus diisi";
    }
    
    if (!formData.endDate) {
      newErrors.endDate = "Tanggal berakhir harus diisi";
    }
    
    if (formData.startDate && formData.endDate) {
      const startDateTime = new Date(`${formData.startDate}T${formData.startTime}:00`);
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}:00`);
      
      if (endDateTime <= startDateTime) {
        newErrors.endDate = "Tanggal berakhir harus setelah tanggal mulai";
      }
    }
    
    // Validate discount
    if (formData.discountValue <= 0) {
      newErrors.discountValue = "Nilai diskon harus lebih dari 0";
    }
    
    if (formData.discountType === "percentage" && formData.discountValue > 100) {
      newErrors.discountValue = "Persentase diskon tidak boleh lebih dari 100%";
    }
    
    // For quantity-based promotions
    if (formData.type === PromotionType.QUANTITY_BASED && (!formData.minQuantity || formData.minQuantity < 1)) {
      newErrors.minQuantity = "Minimal kuantitas harus diisi dan minimal 1";
    }
    
    // Validate product selection
    if (formData.selectedProductIds.length === 0) {
      newErrors.selectedProductIds = "Minimal satu produk harus dipilih";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission with validation
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(e);
    } else {
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Error message component
  const ErrorMessage: React.FC<{ name: string }> = ({ name }) => {
    return errors[name] ? (
      <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
    ) : null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label className="font-bold">Judul Promosi</Label>
        <Input 
          name="title"
          value={formData.title} 
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className={`border-2 ${errors.title ? 'border-red-500' : 'border-black'}`}
        />
        <ErrorMessage name="title" />
      </div>

      <div>
        <Label className="font-bold">Deskripsi</Label>
        <Textarea 
          name="description"
          value={formData.description} 
          onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
          className="border-2 border-black" 
        />
      </div>

      <div>
        <Label className="font-bold">Tipe Promosi</Label>
        <Select 
          name="type"
          value={formData.type} 
          onValueChange={(value: PromotionType) => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="border-2 border-black">
            <SelectValue placeholder="Pilih tipe promosi" />
          </SelectTrigger>
          <SelectContent className="bg-[#fff] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform">
            <SelectItem value={PromotionType.FLASH_SALE}>Flash Sale</SelectItem>
            <SelectItem value={PromotionType.SPECIAL_DAY}>Special Day</SelectItem>
            <SelectItem value={PromotionType.WEEKEND}>Weekend</SelectItem>
            <SelectItem value={PromotionType.PRODUCT_SPECIFIC}>Product Specific</SelectItem>
            <SelectItem value={PromotionType.QUANTITY_BASED}>Quantity Based</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="font-bold">Tanggal Mulai</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              name="startDate"
              type="date" 
              value={formData.startDate} 
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className={`border-2 ${errors.startDate ? 'border-red-500' : 'border-black'}`}
            />
            <Input 
              name="startTime"
              type="time" 
              value={formData.startTime} 
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="border-2 border-black" 
              placeholder="00:00" 
            />
          </div>
          <ErrorMessage name="startDate" />
        </div>
        <div className="space-y-2">
          <Label className="font-bold">Tanggal Berakhir</Label>
          <div className="grid grid-cols-2 gap-2">
            <Input 
              name="endDate"
              type="date" 
              value={formData.endDate} 
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className={`border-2 ${errors.endDate ? 'border-red-500' : 'border-black'}`}
            />
            <Input 
              name="endTime"
              type="time" 
              value={formData.endTime} 
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="border-2 border-black" 
              placeholder="23:59" 
            />
          </div>
          <ErrorMessage name="endDate" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="font-bold">Tipe Diskon</Label>
          <Select
            name="discountType"
            value={formData.discountType}
            onValueChange={(value: "percentage" | "amount") =>
              setFormData({
                ...formData,
                discountType: value,
              })
            }
          >
            <SelectTrigger className="border-2 border-black">
              <SelectValue placeholder="Pilih tipe diskon" />
            </SelectTrigger>
            <SelectContent className="bg-[#fff] border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:-rotate-1 transition-transform">
              <SelectItem value="percentage">Persentase</SelectItem>
              <SelectItem value="amount">Nominal</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="font-bold">Nilai Diskon</Label>
          <Input 
            name="discountValue"
            type="number" 
            value={formData.discountValue} 
            onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
            min="0" 
            className={`border-2 ${errors.discountValue ? 'border-red-500' : 'border-black'}`}
          />
          <ErrorMessage name="discountValue" />
        </div>
      </div>

      {formData.type === PromotionType.QUANTITY_BASED && (
        <div>
          <Label className="font-bold">Minimal Kuantitas</Label>
          <Input 
            name="minQuantity"
            type="number" 
            value={formData.minQuantity} 
            onChange={(e) => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
            min="1" 
            className={`border-2 ${errors.minQuantity ? 'border-red-500' : 'border-black'}`}
          />
          <ErrorMessage name="minQuantity" />
        </div>
      )}

      <div>
        <Label className="font-bold">Pilih Produk</Label>
        <div className={`${errors.selectedProductIds ? 'border-2 border-red-500 rounded-md p-1' : ''}`}>
          <MultiSelect
            options={products.map((product) => ({
              value: product.produkId.toString(),
              label: `${product.nama} - ${formatRupiah(product.harga)} (${product.kategori.nama})`,
            }))}
            value={formData.selectedProductIds.map(String)}
            onChange={(values: string[]) => setFormData({ ...formData, selectedProductIds: values.map(Number) })}
            placeholder="Pilih produk yang akan mendapat promosi"
          />
        </div>
        <ErrorMessage name="selectedProductIds" />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="default"
          onClick={onCancel}
          disabled={isPending}
          className="border-2 bg-white border-black hover:bg-red-500 hover:text-white"
        >
          Batal
        </Button>
        <Button 
          type="submit" 
          disabled={isPending} 
          className="bg-[#FFD700] text-black hover:bg-black hover:text-[#FFD700] border-2 border-black font-bold"
        >
          {isPending ? "Menyimpan..." : formData.isEditMode ? "Update Promosi" : "Simpan Promosi"}
        </Button>
      </div>
    </form>
  );
};

export { PromotionForm };