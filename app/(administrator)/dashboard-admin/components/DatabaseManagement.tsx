"use client";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatabaseBackupIcon, DatabaseIcon, RotateCcwIcon } from "lucide-react";
import dynamic from "next/dynamic";

// Import komponen dengan dynamic loading untuk menghindari hydration error
// const BackupPage = dynamic(() => import("@/components/BackupPage"), { ssr: false });
const ResetDatabasePanel = dynamic(() => import("./ResetDatabasePanel"), { ssr: false });

export default function DatabaseManagementPage() {
  const [activeTab, setActiveTab] = useState("backup");

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Manajemen Database</h1>
      
      <div className="bg-white p-5 rounded-lg shadow-sm border mb-6">
        <Tabs defaultValue="backup" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <DatabaseBackupIcon size={18} />
              <span>Backup Database</span>
            </TabsTrigger>
            <TabsTrigger value="reset" className="flex items-center gap-2">
              <RotateCcwIcon size={18} />
              <span>Reset Database</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="reset">
            <ResetDatabasePanel />
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="bg-white p-5 rounded-lg shadow-sm border">
        <h2 className="text-lg font-medium mb-4">Tentang Manajemen Database</h2>
        
        <div className="prose prose-sm max-w-none">
          <p>
            Halaman ini menyediakan alat untuk mengelola database PostgreSQL Anda, termasuk backup dan reset database.
          </p>
          
          <ul className="mt-2">
            <li><strong>Backup Database</strong> - Membuat salinan cadangan database untuk mencegah kehilangan data</li>
            <li><strong>Reset Database</strong> - Menghapus semua data dan membuat ulang database kosong</li>
          </ul>
          
          <div className="flex items-start space-x-2 mt-4 p-3 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
            <DatabaseIcon size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Penggunaan yang Direkomendasikan:</p>
              <p className="mt-1">
                Selalu buat cadangan database secara berkala dan sebelum melakukan perubahan besar pada sistem.
                Gunakan fitur reset hanya jika benar-benar diperlukan dan pastikan Anda memiliki backup terbaru.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}