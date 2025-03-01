"use client";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, Printer } from "lucide-react";
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface RefundDetailsProps {
  transactionDetails: {
    penjualanId: number;
    tanggalPenjualan: string;
    user?: {
      username: string;
    };
    // Add customer information fields
    pelanggan?: {
      nama: string;
    };
  };
  returnedItems: {
    produkId: number;
    nama: string;
    kuantitas: number;
    harga: number;
    image: string;
    maxKuantitas?: number;
  }[];
  replacementItems: {
    produkId: number;
    nama: string;
    kuantitas: number;
    harga: number;
    image: string;
  }[];
  totalReturn: number;
  totalReplacement: number;
  additionalPayment: number;
}

interface RefundReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: RefundDetailsProps;
}

export const RefundReceiptModal: React.FC<RefundReceiptModalProps> = ({ isOpen, onClose, data }) => {
  const [petugasName, setPetugasName] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("Guest");
  const [storeName] = useState<string>("Toko Cita Rasa");
  const [storeAddress] = useState<string>("Jl. Manunggal No. IV, Sukatali");
  const [storePhone] = useState<string>("0831-2422-7215");
  const [currentDateTime] = useState<Date>(new Date());
  
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
      // Fetch petugas data if user exists in transaction details
      if (data.transactionDetails.user?.username) {
        setPetugasName(data.transactionDetails.user.username);
      } else {
        setPetugasName("Unknown");
      }
      
      // Set customer name if available, otherwise use "Guest"
      if (data.transactionDetails.pelanggan?.nama) {
        setCustomerName(data.transactionDetails.pelanggan.nama);
      } else {
        setCustomerName("Guest");
      }
    };

    fetchData();
  }, [data]);

  // Calculate final amount (could be refund to customer or additional payment from customer)
  const finalAmount = data.totalReturn - data.totalReplacement;
  const isRefundToCustomer = finalAmount > 0;
  
  const generatePDF = () => {
    // Define receipt size: width 80mm
    const receiptWidth = 80; // 80mm
    const receiptHeight = 200; // adjust height as needed
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [receiptWidth, receiptHeight]
    });
  
    const lineHeight = 3.5; // mm
    let yPos = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 5;
  
    // Helper function for centered text
    interface CenterTextParams {
      text: string;
      y: number;
    }

    const centerText = ({ text, y }: CenterTextParams): void => {
      doc.text(text, pageWidth / 2, y, { align: 'center' });
    };
  
    // Helper function for left-right text
    interface LeftRightTextParams {
      left: string;
      right: string;
      y: number;
    }

    const leftRightText = ({ left, right, y }: LeftRightTextParams): void => {
      doc.text(left, margin, y);
      doc.text(right, pageWidth - margin, y, { align: 'right' });
    };
  
    // Helper function for dashed line
    const addDashedLine = (y: number) => {
      doc.setDrawColor(0);
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(margin, y, pageWidth - margin, y);
    };
  
    // Store information (header)
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    centerText({ text: storeName, y: yPos });
    yPos += lineHeight * 1.2;
  
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    centerText({ text: storeAddress, y: yPos });
    yPos += lineHeight;
    centerText({ text: `Telp: ${storePhone}`, y: yPos });
    yPos += lineHeight * 1.5;
  
    addDashedLine(yPos);
    yPos += lineHeight;
  
    // Receipt information
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    centerText({ text: "BUKTI PENGEMBALIAN BARANG", y: yPos });
    yPos += lineHeight * 1.5;
  
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
  
    // Transaction details
    leftRightText({ left: "No. Transaksi Asal:", right: `#${data.transactionDetails.penjualanId}`, y: yPos });
    yPos += lineHeight;
  
    const formattedDate = currentDateTime.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  
    const formattedTime = currentDateTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  
    leftRightText({ left: "Tgl. Transaksi Asal:", right: new Date(data.transactionDetails.tanggalPenjualan).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }), y: yPos });
    yPos += lineHeight;
    
    leftRightText({ left: "Tgl. Pengembalian:", right: formattedDate, y: yPos });
    yPos += lineHeight;
    leftRightText({ left: "Jam:", right: formattedTime, y: yPos });
    yPos += lineHeight;
    leftRightText({ left: "Petugas:", right: petugasName, y: yPos });
    yPos += lineHeight;
    leftRightText({ left: "Pelanggan:", right: customerName, y: yPos });
    yPos += lineHeight * 1.5;
  
    addDashedLine(yPos);
    yPos += lineHeight;
  
    // Returned Items Section
    if (data.returnedItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text("BARANG DIKEMBALIKAN", margin, yPos);
      yPos += lineHeight * 1.5;
      
      doc.setFont('helvetica', 'normal');
      
      data.returnedItems.forEach((item) => {
        if (item.kuantitas > 0) {
          doc.text(`${item.nama}`, margin, yPos);
          yPos += lineHeight;
          
          doc.text(`${item.kuantitas} x ${formatCurrency(item.harga)}`, margin + 2, yPos);
          doc.text(formatCurrency(item.harga * item.kuantitas), pageWidth - margin, yPos, { align: 'right' });
          yPos += lineHeight * 1.2;
        }
      });
      
      doc.setFont('helvetica', 'bold');
      leftRightText({ left: "Total Pengembalian:", right: formatCurrency(data.totalReturn), y: yPos });
      yPos += lineHeight * 1.5;
    }
    
    addDashedLine(yPos);
    yPos += lineHeight;
    
    // Replacement Items Section
    if (data.replacementItems.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text("BARANG PENGGANTI", margin, yPos);
      yPos += lineHeight * 1.5;
      
      doc.setFont('helvetica', 'normal');
      
      data.replacementItems.forEach((item) => {
        doc.text(`${item.nama}`, margin, yPos);
        yPos += lineHeight;
        
        doc.text(`${item.kuantitas} x ${formatCurrency(item.harga)}`, margin + 2, yPos);
        doc.text(formatCurrency(item.harga * item.kuantitas), pageWidth - margin, yPos, { align: 'right' });
        yPos += lineHeight * 1.2;
      });
      
      doc.setFont('helvetica', 'bold');
      leftRightText({ left: "Total Penggantian:", right: formatCurrency(data.totalReplacement), y: yPos });
      yPos += lineHeight * 1.5;
    }
    
    addDashedLine(yPos);
    yPos += lineHeight;
    
    // Additional Payment Section
    if (data.additionalPayment > 0) {
      leftRightText({ left: "Tambahan Bayar:", right: formatCurrency(data.additionalPayment), y: yPos });
      yPos += lineHeight;
    }
    
    // Summary
    doc.setFont('helvetica', 'bold');
    if (isRefundToCustomer) {
      leftRightText({ left: "Refund ke Pelanggan:", right: formatCurrency(finalAmount), y: yPos });
    } else {
      leftRightText({ left: "Selisih Dibayar Pelanggan:", right: formatCurrency(Math.abs(finalAmount)), y: yPos });
    }
    yPos += lineHeight * 2;
    
    addDashedLine(yPos);
    yPos += lineHeight * 1.5;
    
    // Footer
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    centerText({ text: "Terima kasih atas kunjungan Anda", y: yPos });
    yPos += lineHeight;
    centerText({ text: "Bukti pengembalian ini adalah bukti sah", y: yPos });
    yPos += lineHeight;
    centerText({ text: "dari Toko Cita Rasa", y: yPos });
    
    return doc;
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generatePDF();
      doc.save(`struk-pengembalian-${data.transactionDetails.penjualanId}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat struk. Silakan coba lagi.');
    }
  };

  const handlePrintPDF = () => {
    try {
      const doc = generatePDF();
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      
      // Open in new window and print
      const printWindow = window.open(url);
      
      if (printWindow) {
        printWindow.onload = function() {
          printWindow.print();
          URL.revokeObjectURL(url);
        };
      } else {
        alert('Mohon izinkan pop-up untuk mencetak struk.');
      }
    } catch (error) {
      console.error('Error printing PDF:', error);
      alert('Gagal mencetak struk. Silakan coba lagi.');
    }
  };

  if (!isOpen) return null;

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
        className="bg-white w-96 p-6 rounded-lg shadow-2xl border-4 border-black max-h-[90vh] overflow-y-auto"
      >
        <div className="flex flex-col items-center mb-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
            <CheckCircle2 className="text-green-500 w-20 h-20" />
          </motion.div>
          <h2 className="text-2xl font-bold mt-4 text-center">Pengembalian Berhasil!</h2>
        </div>
        
        <div className="text-center mb-4">
          <p className="text-sm text-gray-600">
            {currentDateTime.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
          <p className="text-sm text-gray-600">No. Transaksi Asal: {data.transactionDetails.penjualanId}</p>
          <p className="text-sm text-gray-600">Petugas: {petugasName}</p>
          <p className="text-sm text-gray-600">Pelanggan: {customerName}</p>
        </div>
        
        {/* Returned Items */}
        {data.returnedItems.some(item => item.kuantitas > 0) && (
          <div className="mb-4">
            <h3 className="font-bold text-lg border-b-2 border-black pb-1 mb-2">Barang Dikembalikan</h3>
            <div className="space-y-2">
              {data.returnedItems.filter(item => item.kuantitas > 0).map((item, index) => (
                <div key={`returned-${index}`} className="flex justify-between">
                  <span>
                    {item.nama} x{item.kuantitas}
                  </span>
                  <span>{formatCurrency(item.harga * item.kuantitas)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total Pengembalian:</span>
              <span>{formatCurrency(data.totalReturn)}</span>
            </div>
          </div>
        )}
        
        {/* Replacement Items */}
        {data.replacementItems.length > 0 && (
          <div className="mb-4">
            <h3 className="font-bold text-lg border-b-2 border-black pb-1 mb-2">Barang Pengganti</h3>
            <div className="space-y-2">
              {data.replacementItems.map((item, index) => (
                <div key={`replacement-${index}`} className="flex justify-between">
                  <span>
                    {item.nama} x{item.kuantitas}
                  </span>
                  <span>{formatCurrency(item.harga * item.kuantitas)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold mt-2">
              <span>Total Penggantian:</span>
              <span>{formatCurrency(data.totalReplacement)}</span>
            </div>
          </div>
        )}
        
        {/* Summary */}
        <div className="border-t-2 border-b-2 border-black py-2 mb-4">
          {data.additionalPayment > 0 && (
            <div className="flex justify-between">
              <span>Tambahan Bayar:</span>
              <span>{formatCurrency(data.additionalPayment)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-lg mt-2">
            {isRefundToCustomer ? (
              <>
                <span>Refund ke Pelanggan:</span>
                <span>{formatCurrency(finalAmount)}</span>
              </>
            ) : (
              <>
                <span>Selisih Dibayar Pelanggan:</span>
                <span>{formatCurrency(Math.abs(finalAmount))}</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <button
            onClick={handlePrintPDF}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Cetak Struk
          </button>
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