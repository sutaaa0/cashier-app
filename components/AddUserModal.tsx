"use client"

import React from 'react';
import { X } from 'lucide-react';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from '@/hooks/use-toast';
import { addUser } from '@/server/actions';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Define the form schema with Zod
const userFormSchema = z.object({
  username: z.string().min(1, { message: "Username harus diisi" }),
  password: z.string().min(8, { message: "Password harus minimal 8 karakter" }),
  level: z.enum(["PETUGAS", "ADMIN"], {
    required_error: "Level harus dipilih",
  }),
})

// Type for the form values
type UserFormValues = z.infer<typeof userFormSchema>

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  // Define form with React Hook Form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      level: "PETUGAS",
    },
  })

  const onSubmit = async (data: UserFormValues) => {
    try {
      const response = await addUser({
        username: data.username,
        password: data.password,
        level: data.level,
      });

      if (response.status === "Success") {
        toast({
          title: "Berhasil",
          description: "User berhasil ditambahkan",
        });
        onClose();
        // Reset form
        form.reset();
      } else {
        toast({
          title: "Error",
          description: response.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log(error)
      toast({
        title: "Error",
        description: "Gagal menambahkan user",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add New User</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Password</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="password"
                      className="p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-bold">Level</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="p-2 border-[3px] border-black rounded focus:outline-none focus:ring-2 focus:ring-[#93B8F3]">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PETUGAS">Petugas</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button
              type="submit"
              className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
            >
              Add User
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}