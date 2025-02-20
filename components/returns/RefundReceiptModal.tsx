"use client";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { formatRupiah } from "@/lib/formatIdr";

interface RefundReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    transactionDetails: {
      penjualanId: number;
      tanggalPenjualan: string;
      user?: {
        username: string;
      };
    };
    returnedItems: {
      produkId: number;
      nama: string;
      kuantitas: number;
      harga: number;
    }[];
    replacementItems: {
      produkId: number;
      nama: string;
      kuantitas: number;
      harga: number;
    }[];
    totalReturn: number;
    totalReplacement: number;
    additionalPayment: number;
  };
}

export function RefundReceiptModal({ isOpen, onClose, data }: RefundReceiptModalProps) {
  if (!isOpen || !data?.transactionDetails) return null;

  const handleClose = () => {
    onClose();
    // Refresh the page
    window.location.reload();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ">
      <motion.div initial={{ scale: 0.7, y: 50 }} animate={{ scale: 1, y: 0 }} className="bg-white p-6 rounded-lg shadow-2xl border-4 border-black w-[500px]">
        <div className="flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mr-4" />
          <div className="flex flex-col justify-center items-center w-full">
            <h2 className="text-2xl font-bold text-gray-800">Pengembalian Berhasil!</h2>
            <p className="text-gray-600 text-center">Nota pengembalian berikut adalah rincian transaksi Anda.</p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Detail Transaksi</h3>
          <div className="border-b pb-2">
            <p className="text-gray-600">
              No. Transaksi: <span className="font-medium">{data.transactionDetails.penjualanId}</span>
            </p>
            <p className="text-gray-600">
              Tanggal:{" "}
              <span className="font-medium">
                {format(new Date(data.transactionDetails.tanggalPenjualan), "dd MMMM yyyy HH:mm", {
                  locale: id,
                })}
              </span>
            </p>
            <p className="text-gray-600">
              Kasir: <span className="font-medium">{data.transactionDetails.user?.username || "Admin"}</span>
            </p>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-xl font-semibold text-gray-700 mb-3">Barang yang Dikembalikan</h3>
          {data.returnedItems.map((item) => (
            <div key={item.produkId} className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">{item.nama}</span>
              <span className="text-gray-600">
                {item.kuantitas} x {formatRupiah(item.harga)}
              </span>
              <span className="font-medium">{formatRupiah(item.kuantitas * item.harga)}</span>
            </div>
          ))}
          <div className="flex justify-between font-semibold mt-2">
            <span>Total Pengembalian:</span>
            <span>{formatRupiah(data.totalReturn)}</span>
          </div>
        </div>

        {data.replacementItems.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-3">Barang Pengganti</h3>
            {data.replacementItems.map((item) => (
              <div key={item.produkId} className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">{item.nama}</span>
                <span className="text-gray-600">
                  {item.kuantitas} x {formatRupiah(item.harga)}
                </span>
                <span className="font-medium">{formatRupiah(item.kuantitas * item.harga)}</span>
              </div>
            ))}
            <div className="flex justify-between font-semibold mt-2">
              <span>Total Penggantian:</span>
              <span>{formatRupiah(data.totalReplacement)}</span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between font-bold">
            <span>Total Pengembalian:</span>
            <span>{formatRupiah(data.totalReturn)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Total Penggantian:</span>
            <span>{formatRupiah(data.totalReplacement)}</span>
          </div>
          {data.additionalPayment > 0 && (
            <div className="flex justify-between font-bold text-red-600">
              <span>Pembayaran Tambahan:</span>
              <span>{formatRupiah(data.additionalPayment)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg pt-2 border-t-2 border-black">
            <span>Selisih:</span>
            <span>{formatRupiah(Math.abs(data.totalReplacement - data.totalReturn))}</span>
            <span>Kembalian:</span>
            <span>{formatRupiah(Math.abs(data.totalReplacement - data.totalReturn - data.additionalPayment))}</span>
          </div>
        </div>

        <div className="mt-4">
          <button onClick={handleClose} className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Tutup
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
