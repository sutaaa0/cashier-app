"use client";

import { useState } from "react";
import { DatabaseBackup } from "lucide-react";
import { NeoProgressIndicator } from "@/components/NeoProgresIndicator";

export default function BackupBtn() {
  const [isLoading, setIsLoading] = useState(false);

  const handleBackup = async () => {
    setIsLoading(true);

    try {
      const res = await fetch('/api/backup');

      if (!res.ok) {
        throw new Error('Backup gagal.');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backup.sql';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NeoProgressIndicator isLoading={isLoading} message="Membuat Backup..." />
      <div
        className="w-full bg-green-400 flex items-center space-x-3 p-3 border-[3px] border-black font-bold transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
        onClick={handleBackup}
      >
        <DatabaseBackup />
        <span>Backup Database</span>
      </div>
    </>
  );
}
