// FILE: components/RestoreConfirmModal.tsx
"use client";

import { useState } from "react";
import { Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface RestoreConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: RestoreOptions) => void;
  filename: string;
  isPending: boolean;
}

export interface RestoreOptions {
  filename: string;
  preserveMasterData: boolean;
  truncateBeforeRestore: boolean;
}

export function RestoreConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  filename,
  isPending
}: RestoreConfirmModalProps) {
  const [preserveMasterData, setPreserveMasterData] = useState(true);
  const [truncateBeforeRestore, setTruncateBeforeRestore] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm({
      filename,
      preserveMasterData,
      truncateBeforeRestore
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white max-w-2xl mx-auto p-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
        <div className="mb-6">
          <h2 className="text-2xl font-bold uppercase mb-2 text-black flex items-center">
            <AlertTriangle className="text-orange-500 mr-2" size={24} />
            KONFIRMASI RESTORE DATABASE
          </h2>
          <p className="text-black font-bold">File backup: {filename}</p>
        </div>

        <div className="mb-6 bg-orange-100 p-4 border-2 border-orange-400">
          <div className="flex items-start">
            <Info className="text-orange-500 mt-1 mr-2 flex-shrink-0" size={20} />
            <div>
              <p className="font-bold text-orange-700">PERHATIAN!</p>
              <p className="text-orange-700">
                Restore database akan mengganti semua data saat ini dengan data dari file backup yang dipilih. 
                Pastikan Anda telah membuat backup data saat ini sebelum melanjutkan.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 mb-6">
          <div className="flex items-center gap-3 bg-white p-3 border-2 border-black">
            <input
              type="checkbox"
              id="preserveMasterData"
              checked={preserveMasterData}
              onChange={(e) => setPreserveMasterData(e.target.checked)}
              className="w-6 h-6 border-2 border-black"
              disabled={isPending}
            />
            <div>
              <label htmlFor="preserveMasterData" className="font-bold text-lg block">
                PERTAHANKAN DATA MASTER
              </label>
              <p className="text-sm text-gray-700">
                Jika diaktifkan, data master (user, produk, kategori) yang sudah ada tidak akan ditimpa. 
                Data yang tidak ada di database saat ini akan ditambahkan.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 border-2 border-black">
            <input
              type="checkbox"
              id="truncateBeforeRestore"
              checked={truncateBeforeRestore}
              onChange={(e) => setTruncateBeforeRestore(e.target.checked)}
              className="w-6 h-6 border-2 border-black"
              disabled={isPending}
            />
            <div>
              <label htmlFor="truncateBeforeRestore" className="font-bold text-lg block">
                KOSONGKAN DATA TRANSAKSI SEBELUM RESTORE
              </label>
              <p className="text-sm text-gray-700">
                Jika diaktifkan, semua data transaksi saat ini akan dihapus sebelum melakukan restore.
                Ini membantu mencegah duplikasi data transaksi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-between">
          <button
            onClick={onClose}
            disabled={isPending}
            className="py-3 px-6 border-2 border-black bg-gray-200 font-bold hover:bg-gray-300 flex justify-center items-center gap-2"
          >
            <XCircle size={20} />
            BATAL
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="py-3 px-6 border-2 border-black bg-orange-500 text-white font-bold hover:bg-orange-600 flex justify-center items-center gap-2"
          >
            {isPending ? (
              <>
                <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></span>
                <span>PROSES...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={20} />
                <span>RESTORE DATABASE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}