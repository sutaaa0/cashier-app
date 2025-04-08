"use client";

import type React from "react";
import { useEffect } from "react";
import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { createCustomer } from "@/server/actions";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const customerFormSchema = z.object({
  name: z.string().min(1, { message: "Nama harus diisi" }),
  address: z.string().min(1, { message: "Alamat diperlukan" }),
  phoneNumber: z
    .string()
    .min(1, { message: "Diperlukan nomor telepon" })
    .regex(/^08[0-9]{8,11}$/, {
      message: "Format nomor telepon tidak valid (gunakan format: 08xxxxxxxxxx)",
    }),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerAdded: () => void;
}

export function AddCustomerModal({ isOpen, onClose, onCustomerAdded }: AddCustomerModalProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      const result = await createCustomer({
        nama: data.name,
        alamat: data.address,
        nomorTelepon: data.phoneNumber,
      });

      if (result.status === "Success") {
        toast({ title: "Berhasil", description: "Pelanggan berhasil ditambahkan" });
        onClose();
        onCustomerAdded();
      } else {
        if (result.message && result.message.includes("duplicate")) {
          toast({ title: "Error", description: "Nomor telepon sudah terdaftar", variant: "destructive" });
          form.setError("phoneNumber", { type: "manual", message: "Nomor telepon yang sudah digunakan" });
        } else {
          toast({ title: "Error", description: result.message, variant: "destructive" });
        }
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Gagal menambahkan member", variant: "destructive" });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Tambahkan Member Baru</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nama</FormLabel>
                  <FormControl>
                    <Input {...field} className="p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]" />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Alamat</FormLabel>
                  <FormControl>
                    <Input {...field} className="p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]" />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" className="p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]" placeholder="Format: 08xxxxxxxxxx" />
                  </FormControl>
                  <FormMessage className="text-red-500" />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
            >
              Tambah member
            </Button>
          </form>
        </Form>
      </div>
      <NeoProgressIndicator isLoading={isLoading} message="Menambahkan pelanggan baru..." />
    </div>
  );
}
