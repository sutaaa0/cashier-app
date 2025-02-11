import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download } from "lucide-react";
import jsPDF from 'jspdf';

interface TransactionDetails {
  penjualanId: string | number;
  tanggalPenjualan: string;
  user?: {
    username: string;
  };
}

interface RefundReceiptModalProps {
  data: {
    transactionDetails: TransactionDetails;
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
  onClose: () => void;
}

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount);
};

export const RefundReceiptModal: React.FC<RefundReceiptModalProps> = ({ data, onClose }) => {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Nota Pengembalian', 105, 20, { align: 'center' });
    
    // Store Info
    doc.setFontSize(16);
    doc.text('Suta Cake', 105, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Jl.Manuggal IV, Sukatali', 105, 45, { align: 'center' });
    doc.text('Telp: 098987765', 105, 55, { align: 'center' });
    
    // Transaction Details
    doc.text(`No. Transaksi: ${data.transactionDetails.penjualanId}`, 20, 75);
    doc.text(`Tanggal: ${new Date(data.transactionDetails.tanggalPenjualan).toLocaleDateString("id-ID")}`, 20, 85);
    doc.text(`Kasir: ${data.transactionDetails.user?.username || "Admin"}`, 20, 95);
    
    // Returned Items
    let yPos = 115;
    doc.setFontSize(14);
    doc.text('Barang yang Dikembalikan:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    
    data.returnedItems.forEach((item) => {
      doc.text(`${item.nama} x${item.kuantitas}`, 20, yPos);
      doc.text(formatRupiah(item.harga * item.kuantitas), 150, yPos);
      yPos += 10;
    });
    
    yPos += 10;
    doc.text('Total Pengembalian:', 20, yPos);
    doc.text(formatRupiah(data.totalReturn), 150, yPos);
    
    // Replacement Items
    if (data.replacementItems.length > 0) {
      yPos += 20;
      doc.setFontSize(14);
      doc.text('Barang Pengganti:', 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      
      data.replacementItems.forEach((item) => {
        doc.text(`${item.nama} x${item.kuantitas}`, 20, yPos);
        doc.text(formatRupiah(item.harga * item.kuantitas), 150, yPos);
        yPos += 10;
      });
      
      yPos += 10;
      doc.text('Total Penggantian:', 20, yPos);
      doc.text(formatRupiah(data.totalReplacement), 150, yPos);
    }
    
    // Summary
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('Uang Kembalian:', 20, yPos);
    doc.text(formatRupiah(data.totalReplacement - data.totalReturn), 150, yPos);
    
    if (data.additionalPayment > 0) {
      yPos += 10;
      doc.text('Pembayaran Tambahan:', 20, yPos);
      doc.text(formatRupiah(data.additionalPayment), 150, yPos);
    }
    
    // Save the PDF
    doc.save('nota-pengembalian.pdf');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <motion.div
        initial={{ scale: 0.7, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-96 p-6 rounded-lg shadow-2xl border-4 border-black"
      >
        <div className="flex flex-col items-center mb-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
            <CheckCircle2 className="text-green-500 w-20 h-20" />
          </motion.div>
          <h2 className="text-2xl font-bold mt-4 text-center">Nota Pengembalian</h2>
        </div>
        
        <div className="text-center mb-4">
          <h3 className="font-bold text-xl">Suta Cake</h3>
          <p className="text-sm text-gray-600">Jl.Manuggal IV, Sukatali</p>
          <p className="text-sm text-gray-600">Telp: 098987765</p>
        </div>

        <div className="text-sm mb-4">
          <p>No. Transaksi: {data.transactionDetails.penjualanId}</p>
          <p>Tanggal: {new Date(data.transactionDetails.tanggalPenjualan).toLocaleDateString("id-ID")}</p>
          <p>Kasir: {data.transactionDetails.user?.username || "Admin"}</p>
        </div>

        <div className="border-t-2 border-b-2 border-black py-2 mb-4">
          <p className="font-bold mb-2">Barang yang Dikembalikan:</p>
          {data.returnedItems.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>
                {item.nama} x{item.kuantitas}
              </span>
              <span>{formatRupiah(item.harga * item.kuantitas)}</span>
            </div>
          ))}
        </div>

        {data.replacementItems.length > 0 && (
          <div className="border-b-2 border-black py-2 mb-4">
            <p className="font-bold mb-2">Barang Pengganti:</p>
            {data.replacementItems.map((item, index) => (
              <div key={index} className="flex justify-between">
                <span>
                  {item.nama} x{item.kuantitas}
                </span>
                <span>{formatRupiah(item.harga * item.kuantitas)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Pengembalian:</span>
            <span>{formatRupiah(data.totalReturn)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Penggantian:</span>
            <span>{formatRupiah(data.totalReplacement)}</span>
          </div>
          {data.additionalPayment > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Pembayaran Tambahan:</span>
              <span>{formatRupiah(data.additionalPayment)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold">
            <span>Selisih:</span>
            <span>{formatRupiah(data.totalReplacement - data.totalReturn)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleDownloadPDF}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            onClick={onClose}
            className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};