import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  subject: string;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm, itemName, subject }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[6px] border-black rounded-lg p-8 w-full max-w-md transform rotate-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Konfirmasi Hapus</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="mb-8">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-yellow-400 border-[4px] border-black rounded-full transform -rotate-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <AlertTriangle size={40} className="text-black" />
          </div>
          <p className="text-center text-xl font-bold mb-2">Apakah Anda yakin ingin menghapus?</p>
          <p className="text-center text-gray-600">
            {subject}: <span className="font-bold">{itemName}</span>
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 font-bold text-lg uppercase border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-3 bg-red-500 text-white font-bold text-lg uppercase border-[3px] border-black rounded shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none transition-all"
          >
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

