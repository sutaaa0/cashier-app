'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCustomer } from "@/server/actions";
import { toast } from "@/hooks/use-toast";

interface CustomerInputProps {
  onSubmit: (customerData: { nama: string; alamat: string; nomorTelepon: string }) => void;
  onCancel: () => void;
}

export function CustomerInput({ onSubmit, onCancel }: CustomerInputProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const result = await createCustomer({ 
        nama: name, 
        alamat: address, 
        nomorTelepon: phoneNumber 
      });

      if (result.status === "Success") {
        toast({
          title: "Berhasil",
          description: "Data pelanggan berhasil disimpan",
        });
        onSubmit(result.data);
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.log(error);
      toast({
        title: "Error",
        description: "Gagal menyimpan data pelanggan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="address">Alamat</Label>
        <Input
          id="address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <Label htmlFor="phoneNumber">Nomor Telepon</Label>
        <Input
          id="phoneNumber"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </form>
  );
}