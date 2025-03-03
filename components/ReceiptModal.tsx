import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, ShoppingBag, Clock, Calendar, User, CreditCard } from "lucide-react";
import { getCustomerById, getPetugasById } from "@/server/actions";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
      hargaNormal?: number;
      hargaSetelahDiskon?: number;
      discountAmount?: number;
      promotionDetails?: string;
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
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
      setIsLoading(true);
      try {
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [receiptData]);

  const calculateTotalItems = () => {
    return receiptData.orderItems.reduce((total, item) => total + item.kuantitas, 0);
  };

  const calculateTotalSavings = () => {
    return receiptData.orderItems.reduce((total, item) => {
      const discount = item.discountAmount || 0;
      return total + discount;
    }, 0);
  };

  const generatePDF = () => {
    // Tentukan ukuran struk: lebar 80mm, tinggi dinamis
    const receiptWidth = 80; // 80mm
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: [receiptWidth, 200], // tinggi awal, akan disesuaikan
    });

    const lineHeight = 3.5; // mm
    let yPos = 10;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 5;

    // Fungsi bantu untuk menampilkan teks di tengah
    const centerText = (text: string, y: number) => {
      doc.text(text, pageWidth / 2, y, { align: "center" });
    };

    // Fungsi bantu untuk teks rata kiri-kanan
    const leftRightText = (left: string, right: string, y: number) => {
      doc.text(left, margin, y);
      doc.text(right, pageWidth - margin, y, { align: "right" });
    };

    // Fungsi bantu untuk menambahkan garis putus-putus
    const addDashedLine = (y: number) => {
      doc.setDrawColor(0);
      doc.setLineDashPattern([0.5, 0.5], 0);
      doc.line(margin, y, pageWidth - margin, y);
    };

    // Informasi toko (header)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    centerText(storeName, yPos);
    yPos += lineHeight * 1.2;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    centerText(storeAddress, yPos);
    yPos += lineHeight;
    centerText(`Telp: ${storePhone}`, yPos);
    yPos += lineHeight * 1.5;

    addDashedLine(yPos);
    yPos += lineHeight;

    // Informasi struk
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    centerText("BUKTI PEMBAYARAN", yPos);
    yPos += lineHeight * 1.5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");

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
    yPos += lineHeight;
    leftRightText("Jumlah Item:", calculateTotalItems().toString(), yPos);
    yPos += lineHeight * 1.5;

    addDashedLine(yPos);
    yPos += lineHeight;

    // Detail Pesanan
    doc.setFont("helvetica", "bold");
    doc.text("DETAIL PESANAN", margin, yPos);
    yPos += lineHeight * 1.5;

    doc.setFont("helvetica", "normal");

    receiptData.orderItems.forEach((item) => {
      doc.text(`${item.nama}`, margin, yPos);
      yPos += lineHeight;

      // Tampilkan harga satuan jika tersedia
      const hargaSatuan = item.hargaSatuan || Math.round(item.subtotal / item.kuantitas);
      doc.text(`${item.kuantitas} x ${formatCurrency(hargaSatuan)}`, margin + 2, yPos);
      doc.text(formatCurrency(item.subtotal), pageWidth - margin, yPos, { align: "right" });
      yPos += lineHeight * 1.2;

      // Jika ada diskon, tampilkan harga normal dan harga setelah diskon
      if (item.discountAmount && item.discountAmount > 0 && item.hargaNormal && item.hargaSetelahDiskon) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.text(`Harga Normal: ${formatCurrency(item.hargaNormal)}`, margin + 2, yPos);
        yPos += lineHeight;
        doc.text(`Harga Diskon: ${formatCurrency(item.hargaSetelahDiskon)}`, margin + 2, yPos);
        yPos += lineHeight;
        doc.text(`Anda Hemat: ${formatCurrency(item.discountAmount)}`, margin + 2, yPos);
        yPos += lineHeight;
        // Kembalikan ukuran font
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
      }

      // Tampilkan detail promosi jika ada
      if (item.promotionDetails) {
        doc.setFontSize(7);
        doc.setFont("helvetica", "italic");
        doc.text(item.promotionDetails, margin + 2, yPos);
        yPos += lineHeight;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
      }
    });

    addDashedLine(yPos);
    yPos += lineHeight * 1.2;

    // Totals
    doc.setFont("helvetica", "normal");
    
    // Tampilkan total penghematan jika ada diskon
    const totalSavings = calculateTotalSavings();
    if (totalSavings > 0) {
      doc.setFont("helvetica", "italic");
      leftRightText("Total Hemat:", formatCurrency(totalSavings), yPos);
      yPos += lineHeight;
      doc.setFont("helvetica", "normal");
    }
    
    leftRightText("Subtotal:", formatCurrency(receiptData.finalTotal), yPos);
    yPos += lineHeight;

    leftRightText("Tunai:", formatCurrency(receiptData.amountReceived), yPos);
    yPos += lineHeight;

    doc.setFont("helvetica", "bold");
    leftRightText("Kembali:", formatCurrency(receiptData.change), yPos);
    yPos += lineHeight * 2;

    addDashedLine(yPos);
    yPos += lineHeight * 1.5;

    // Footer
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    centerText("Terima kasih atas kunjungan Anda", yPos);
    yPos += lineHeight;
    centerText("Produk yang telah dibeli tidak dapat ditukar/dikembalikan", yPos);
    yPos += lineHeight;
    centerText("Kecuali jika terjadi kesalahan dari petugas toko.", yPos);
    yPos += lineHeight * 1.5;
    
    // QR Code placeholder (you can implement actual QR code generation)
    doc.setFontSize(6);
    centerText("Scan untuk program loyalitas pelanggan", yPos);
    yPos += lineHeight * 4; // Space for QR code
    
    // Add store website or social media
    centerText("www.tokocitarasa.com | @tokocitarasa", yPos);
    yPos += lineHeight * 2;

    return doc;
  };

  const handleDownloadPDF = () => {
    try {
      const doc = generatePDF();
      doc.save(`struk-${receiptData.PenjualanId}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal membuat struk. Silakan coba lagi.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.7, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-md p-6 rounded-xl shadow-2xl border-2 border-green-500"
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Memuat data struk...</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center mb-6">
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="bg-green-100 p-4 rounded-full"
              >
                <CheckCircle2 className="text-green-500 w-16 h-16" />
              </motion.div>
              <h2 className="text-2xl font-bold mt-4 text-center text-green-700">Transaksi Berhasil!</h2>
              <p className="text-sm text-gray-500 mt-1">No. Transaksi: #{receiptData.PenjualanId}</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2">Informasi Transaksi</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-green-600" />
                  <span>
                    {receiptData.transactionDate.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-green-600" />
                  <span>
                    {receiptData.transactionDate.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <User className="w-4 h-4 mr-2 text-green-600" />
                  <span>Pelanggan: {customerName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <CreditCard className="w-4 h-4 mr-2 text-green-600" />
                  <span>Kasir: {petugasName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-700 col-span-2">
                  <ShoppingBag className="w-4 h-4 mr-2 text-green-600" />
                  <span>Total Item: {calculateTotalItems()} item</span>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center">
                <ShoppingBag className="w-4 h-4 mr-2 text-green-600" />
                Detail Pesanan
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {receiptData.orderItems.map((item, index) => {
                      return (
                        <React.Fragment key={index}>
                          <tr className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.nama}</td>
                            <td className="px-4 py-3 text-sm text-gray-500 text-right">{item.kuantitas}x</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.subtotal)}</td>
                          </tr>
                          {(item.discountAmount && item.discountAmount > 0) || item.promotionDetails ? (
                            <tr className="bg-red-50">
                              <td colSpan={3} className="px-4 py-1 text-xs">
                                {item.hargaNormal && item.hargaSetelahDiskon && (
                                  <div className="flex justify-between text-gray-600">
                                    <span>Harga Normal: {formatCurrency(item.hargaNormal)}</span>
                                    <span className="text-red-600 font-medium">
                                      Hemat: {formatCurrency(item.discountAmount || 0)}
                                    </span>
                                  </div>
                                )}
                                {item.promotionDetails && (
                                  <div className="text-red-600 font-medium mt-1">{item.promotionDetails}</div>
                                )}
                              </td>
                            </tr>
                          ) : null}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{formatCurrency(receiptData.finalTotal)}</span>
              </div>
              
              {calculateTotalSavings() > 0 && (
                <div className="flex justify-between mb-2 text-red-600 text-sm">
                  <span>Total Hemat:</span>
                  <span className="font-medium">{formatCurrency(calculateTotalSavings())}</span>
                </div>
              )}
              
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tunai:</span>
                <span>{formatCurrency(receiptData.amountReceived)}</span>
              </div>
              
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span className="text-gray-800">Kembali:</span>
                <span className="text-green-700">{formatCurrency(receiptData.change)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleDownloadPDF}
                className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Download className="w-5 h-5" />
                Download Struk
              </button>
              <button
                onClick={onClose}
                className="bg-gray-800 text-white py-3 rounded-lg hover:bg-black transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
            
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>{storeName} | {storeAddress}</p>
              <p className="mt-1">Terima kasih atas kunjungan Anda</p>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
};