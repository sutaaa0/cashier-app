"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/hooks/use-toast";
import { updatePelanggan } from "@/server/actions";
import type { Pelanggan as PelangganType } from "@prisma/client";
import { NeoProgressIndicator } from "./NeoProgresIndicator";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Define the form schema with Zod
const customerFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  address: z.string().optional(),
  phoneNumber: z
    .string()
    .min(1, { message: "Phone number is required" })
    .regex(/^08[0-9]{8,11}$/, {
      message: "Invalid phone number format (use format: 08xxxxxxxxxx)",
    }),
});

// Type for the form values
type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface EditCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: PelangganType;
  onEditCustomer: (customer: PelangganType) => void;
}

export function EditCustomerModal({ isOpen, onClose, customer, onEditCustomer }: EditCustomerModalProps) {
  // Define form with React Hook Form
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: customer.nama,
      address: customer.alamat || "",
      phoneNumber: customer.nomorTelepon || "",
    },
  });

  // Reset form values when modal opens
  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: customer.nama,
        address: customer.alamat || "",
        phoneNumber: customer.nomorTelepon || "",
      });
    }
  }, [isOpen, customer, form]);

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      const updatedCustomer = {
        ...customer,
        nama: data.name,
        alamat: data.address || null,
        nomorTelepon: data.phoneNumber || null,
      };

      const result = await updatePelanggan(updatedCustomer);

      if (result.status === "Success") {
        toast({
          title: "Berhasil",
          description: "Member berhasil diperbarui",
        });
        onEditCustomer(updatedCustomer);
        onClose();
      } else {
        // Handle specific error for duplicate phone numbers
        if (result.message && result.message.includes("duplicate")) {
          toast({
            title: "Error",
            description: "Nomor telepon sudah terdaftar",
            variant: "destructive",
          });
          form.setError("phoneNumber", {
            type: "manual",
            message: "Nomor telepon yang sudah digunakan",
          });
        } else {
          toast({
            title: "Error",
            description: result.message,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Edit Member</h2>
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
                  <FormMessage />
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
                  <FormMessage />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all disabled:opacity-50"
            >
              Perbarui member
            </Button>
          </form>
        </Form>
      </div>
      <NeoProgressIndicator isLoading={isLoading} message="Updating customer..." />
    </div>
  );
}
