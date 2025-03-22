"use client"

import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
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
import { NeoProgressIndicator } from './NeoProgresIndicator';

const userFormSchema = z.object({
  username: z.string().min(1, { message: "Username required " }),
  password: z.string().min(8, { message: "Password must be at least 8 characters " }),
  level: z.enum(["PETUGAS", "ADMIN"], {
    required_error: "Level harus dipilih",
  }),
});

// Type for the form values
type UserFormValues = z.infer<typeof userFormSchema>;

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddUserModal({ isOpen, onClose }: AddUserModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      level: "PETUGAS",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const onSubmit = async (data: UserFormValues) => {
    setIsLoading(true);
    try {
      const response = await addUser({
        username: data.username,
        password: data.password,
        level: data.level,
      });

      if (response.status === "Success") {
        toast({
          title: "Success",
          description: "User successfully added",
          duration: 3000
        });
        form.reset();
        onClose();
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
        description: "Failed to add user",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add New User</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-200 rounded">
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
                    <Input {...field} className="p-2 border-[3px] border-black rounded" />
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
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        className="p-2 border-[3px] border-black rounded w-full"
                      />
                    </FormControl>
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="p-2 border-[3px] border-black rounded">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className='bg-white rounded border border-black shadow-sm '>
                      <SelectItem value="PETUGAS" className='cursor-pointer'>Petugas</SelectItem>
                      <SelectItem value="ADMIN" className='cursor-pointer'>Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black rounded">Add User</Button>
          </form>
        </Form>
      </div>

      <NeoProgressIndicator isLoading={isLoading} message={"Adding user..."} />
    </div>
  );
}
