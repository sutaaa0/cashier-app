import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download } from "lucide-react";
import { getCustomerById, getPetugasById } from "@/server/actions";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReceiptModalProps {
  receiptData: {
    PenjualanId: number | undefined; 
    finalTotal: number;
    amountReceived: number;
    change: number;
    petugasId: number;
    customerId: number | null;
    orderItems: Array<{
      nama: string;
      kuantitas: number;
      subtotal: number;
      hargaSatuan?: number;
    }>;
    transactionDate: Date;
  };
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptData, onClose }) => {
  const [customerName, setCustomerName] = useState<string>("Guest");
  const [petugasName, setPetugasName] = useState<string>("");
  const [storeName] = useState<string>("Toko Cita Rasa");
  const [storeAddress] = useState<string>("Jl. Manunggal No. IV, Sukatali");
  const [storePhone] = useState<string>("0831-2422-7215");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    const fetchData = async () => {
      // Fetch customer data
      if (receiptData.customerId) {
        try {
          const customer = await getCustomerById(receiptData.customerId);
          setCustomerName(customer?.nama || "Guest");
        } catch (error) {
          console.error("Error fetching customer:", error);
          setCustomerName("Guest");
        }
      }
      
      // Fetch petugas data
      if (receiptData.petugasId) {
        try {
          const petugas = await getPetugasById(receiptData.petugasId);
          setPetugasName(petugas?.username || "Unknown");
        } catch (error) {
          console.error("Error fetching petugas:", error);
          setPetugasName("Unknown");
        }
      }
    };

    fetchData();
  }, [receiptData]);

  const generatePDF = () => {
    // Tentukan ukuran struk: lebar 80mm, tinggi 200mm (silakan sesuaikan tinggi sesuai kebutuhan)
    const receiptWidth = 80; // 80mm
    const receiptHeight = 200; // tinggi tetap, bisa diubah jika diperlukan
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [receiptWidth, receiptHeight]
    });
  
    const lineHeight = 3.5; // mm
    let yPos = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 5;
  
    // Fungsi bantu untuk menampilkan teks di tengah
    const centerText = (text: string, y: number) => {
      doc.text(text, pageWidth / 2, y, { align: 'center' });
    };
  
    // Fungsi bantu untuk teks rata kiri-kanan
    const leftRightText = (left: string, right: string, y: number) => {
      doc.text(left, margin, y);
      doc.text(right, pageWidth - margin, y, { align: 'right' });
    };
  
    // Fungsi bantu untuk menambahkan garis putus-putus
    const addDashedLine = (y: number) => {
      doc.setDrawColor(0);
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(margin, y, pageWidth - margin, y);
    };
  
    // Informasi toko (header)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    centerText(storeName, yPos);
    yPos += lineHeight * 1.2;
  
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    centerText(storeAddress, yPos);
    yPos += lineHeight;
    centerText(`Telp: ${storePhone}`, yPos);
    yPos += lineHeight * 1.5;
  
    addDashedLine(yPos);
    yPos += lineHeight;
  
    // Informasi struk
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    centerText("BUKTI PEMBAYARAN", yPos);
    yPos += lineHeight * 1.5;
  
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
  
    // Detail transaksi
    leftRightText("No. Transaksi:", `#${receiptData.PenjualanId}`, yPos);
    yPos += lineHeight;
  
    const formattedDate = receiptData.transactionDate.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
    const formattedTime = receiptData.transactionDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    leftRightText("Tanggal:", formattedDate, yPos);
    yPos += lineHeight;
    leftRightText("Jam:", formattedTime, yPos);
    yPos += lineHeight;
    leftRightText("Kasir:", petugasName, yPos);
    yPos += lineHeight;
    leftRightText("Pelanggan:", customerName, yPos);
    yPos += lineHeight * 1.5;
  
    addDashedLine(yPos);
    yPos += lineHeight;
  
    // Detail Pesanan
    doc.setFont('helvetica', 'bold');
    doc.text("DETAIL PESANAN", margin, yPos);
    yPos += lineHeight * 1.5;
  
    doc.setFont('helvetica', 'normal');
  
    receiptData.orderItems.forEach((item) => {
      doc.text(`${item.nama}`, margin, yPos);
      yPos += lineHeight;
  
      // Tampilkan harga satuan jika tersedia
      const hargaSatuan = item.hargaSatuan || Math.round(item.subtotal / item.kuantitas);
  
      doc.text(`${item.kuantitas} x ${formatCurrency(hargaSatuan)}`, margin + 2, yPos);
      doc.text(formatCurrency(item.subtotal), pageWidth - margin, yPos, { align: 'right' });
      yPos += lineHeight * 1.2;
    });
  
    addDashedLine(yPos);
    yPos += lineHeight * 1.2;
  
    // Totals
    doc.setFont('helvetica', 'normal');
    leftRightText("Total:", formatCurrency(receiptData.finalTotal), yPos);
    yPos += lineHeight;
  
    leftRightText("Tunai:", formatCurrency(receiptData.amountReceived), yPos);
    yPos += lineHeight;
  
    doc.setFont('helvetica', 'bold');
    leftRightText("Kembali:", formatCurrency(receiptData.change), yPos);
    yPos += lineHeight * 2;
  
    addDashedLine(yPos);
    yPos += lineHeight * 1.5;
  
    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    centerText("Terima kasih atas kunjungan Anda", yPos);
    yPos += lineHeight;
    centerText("Produk yang telah dibeli tidak dapat ditukar/dikembalikan", yPos);
    yPos += lineHeight;
    centerText("Kecuali jika terjadi kesalahan dari petugas toko.", yPos);
    yPos += lineHeight * 2;
  
    return doc;
  };
  

  const handleDownloadPDF = () => {
    try {
      const doc = generatePDF();
      doc.save(`struk-${receiptData.PenjualanId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat struk. Silakan coba lagi.');
    }
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
          <h2 className="text-2xl font-bold mt-4 text-center">Transaksi Berhasil!</h2>
        </div>
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            {receiptData.transactionDate.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="font-medium">Pelanggan: {customerName}</p>
          <p className="text-sm text-gray-600">No. Transaksi: {receiptData.PenjualanId}</p>
          <p className="text-sm text-gray-600">Kasir: {petugasName}</p>
        </div>
        <div className="border-t-2 border-b-2 border-black py-2 mb-4">
          {receiptData.orderItems.map((item, index) => (
            <div key={index} className="flex justify-between">
              <span>
                {item.nama} x{item.kuantitas}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Bayar:</span>
            <span>{formatCurrency(receiptData.finalTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Uang Masuk:</span>
            <span>{formatCurrency(receiptData.amountReceived)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>Kembalian:</span>
            <span>{formatCurrency(receiptData.change)}</span>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handleDownloadPDF}
            className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download Struk
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