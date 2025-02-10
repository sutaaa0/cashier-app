import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download } from "lucide-react";
import { getCustomerById } from "@/server/actions";
import jsPDF from 'jspdf';

interface ReceiptModalProps {
  receiptData: {
    finalTotal: number;
    amountReceived: number;
    change: number;
    petugasId: number;
    customerId: number | null;
    orderItems: Array<{
      nama: string;
      kuantitas: number;
      subtotal: number;
    }>;
    transactionDate: Date;
  };
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptData, onClose }) => {
  const [customerName, setCustomerName] = useState<string>("Guest");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  useEffect(() => {
    const fetchCustomer = async () => {
      if (receiptData.customerId) {
        try {
          const customer = await getCustomerById(receiptData.customerId);
          setCustomerName(customer?.nama || "Guest");
        } catch (error) {
          console.error("Error fetching customer:", error);
          setCustomerName("Guest");
        }
      } else {
        setCustomerName("Guest");
      }
    };

    fetchCustomer();
  }, [receiptData]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('Bukti Transaksi', 105, 20, { align: 'center' });
    
    // Date and Customer
    doc.setFontSize(12);
    doc.text(receiptData.transactionDate.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }), 20, 40);
    doc.text(`Pelanggan: ${customerName}`, 20, 50);
    
    // Items
    doc.text('Detail Pesanan:', 20, 70);
    let yPos = 80;
    
    receiptData.orderItems.forEach((item) => {
      doc.text(`${item.nama} x${item.kuantitas}`, 20, yPos);
      doc.text(formatCurrency(item.subtotal), 150, yPos);
      yPos += 10;
    });
    
    // Totals
    yPos += 10;
    doc.text('Total Bayar:', 20, yPos);
    doc.text(formatCurrency(receiptData.finalTotal), 150, yPos);
    
    yPos += 10;
    doc.text('Uang Masuk:', 20, yPos);
    doc.text(formatCurrency(receiptData.amountReceived), 150, yPos);
    
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Kembalian:', 20, yPos);
    doc.text(formatCurrency(receiptData.change), 150, yPos);
    
    // Save the PDF
    doc.save('bukti-transaksi.pdf');
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