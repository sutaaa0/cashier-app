import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Download, ShoppingBag, Clock, Calendar, User, CreditCard, Coins } from "lucide-react";
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
    customerName?: string;
    orderItems: Array<{
      nama: string;
      kuantitas: number;
      subtotal: number;
      hargaSatuan?: number;
      hargaNormal?: number;
      hargaSetelahDiskon?: number;
      discountAmount?: number;
      discountPercentage?: number;
      promotionDetails?: string;
    }>;
    transactionDate: Date;
    // Field untuk redeem poin
    redeemedPoints?: number;
    totalBeforePointsDiscount?: number;
    // Field untuk diskon promosi
    totalPromotionDiscount?: number;
  };
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptData, onClose }) => {
  const [customerName, setCustomerName] = useState<string>(receiptData.customerName || "Guest");
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
        // Fetch customer data if not already provided
        if (receiptData.customerId && !receiptData.customerName) {
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
    // Gunakan totalPromotionDiscount jika ada, jika tidak, hitung dari orderItems
    if (receiptData.totalPromotionDiscount && receiptData.totalPromotionDiscount > 0) {
      return receiptData.totalPromotionDiscount;
    }

    return receiptData.orderItems.reduce((total, item) => {
      const discount = item.discountAmount || 0;
      return total + discount;
    }, 0);
  };

  // Hitung poin yang didapat dari transaksi ini (1 poin per 200 rupiah)
  const calculateEarnedPoints = () => {
    return Math.floor(receiptData.finalTotal / 200);
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
      doc.setTextColor(255, 0, 0); // Warna merah untuk diskon promosi
      leftRightText("Total Hemat Promosi:", formatCurrency(totalSavings), yPos);
      yPos += lineHeight;
      doc.setTextColor(0, 0, 0); // Reset warna teks
    }

    // Tampilkan subtotal setelah diskon promosi
    leftRightText("Subtotal setelah promosi:", formatCurrency(receiptData.totalBeforePointsDiscount || receiptData.finalTotal), yPos);
    yPos += lineHeight;

    // Tampilkan subtotal sebelum potongan poin jika ada poin yang ditukarkan
    // Tampilkan potongan poin jika ada
    if (receiptData.redeemedPoints && receiptData.redeemedPoints > 0) {
      doc.setTextColor(0, 128, 0); // Warna hijau untuk potongan poin
      leftRightText("Potongan Poin:", `-${formatCurrency(receiptData.redeemedPoints)}`, yPos);
      yPos += lineHeight;
      doc.setTextColor(0, 0, 0); // Reset warna teks

      doc.setFont("helvetica", "bold");
      leftRightText("Total Pembayaran:", formatCurrency(receiptData.finalTotal), yPos);
      yPos += lineHeight;
      doc.setFont("helvetica", "normal");
    } else {
      doc.setFont("helvetica", "bold");
      leftRightText("Total Pembayaran:", formatCurrency(receiptData.finalTotal), yPos);
      yPos += lineHeight;
      doc.setFont("helvetica", "normal");
    }

    leftRightText("Tunai:", formatCurrency(receiptData.amountReceived), yPos);
    yPos += lineHeight;

    doc.setFont("helvetica", "bold");
    leftRightText("Kembali:", formatCurrency(receiptData.change), yPos);
    yPos += lineHeight * 2;

    // Informasi poin member
    if (receiptData.customerId) {
      const earnedPoints = calculateEarnedPoints();
      
      // Hanya tampilkan poin yang didapat jika lebih dari 0
      if (earnedPoints > 0) {
        leftRightText("Poin Didapat:", `${earnedPoints} poin`, yPos);
        yPos += lineHeight;
      }
      
      if (receiptData.redeemedPoints && receiptData.redeemedPoints > 0) {
        leftRightText("Poin Ditukarkan:", `${receiptData.redeemedPoints} poin`, yPos);
        yPos += lineHeight;
      }
      
      // Tambahkan informasi aturan poin member
      doc.setFontSize(7);
      doc.setFont("helvetica", "italic");
      centerText("Informasi Poin Member:", yPos);
      yPos += lineHeight;
      centerText("Setiap transaksi Rp200 = 1 poin", yPos);
      yPos += lineHeight;
      centerText("1 poin = Rp1 untuk penukaran", yPos);
      yPos += lineHeight;
      centerText("Minimal penukaran 1.000 poin", yPos);
      yPos += lineHeight;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
    }

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
      {isLoading ? (
        <div className="bg-white p-8 rounded-xl flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Memuat data struk...</p>
        </div>
      ) : (
        <motion.div
          initial={{ scale: 0.7, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white w-full max-w-md rounded-xl shadow-2xl border-2 border-green-500 flex flex-col max-h-[90vh]"
        >
          {/* Header tetap */}
          <div className="px-6 pt-6 pb-2">
            <div className="flex flex-col items-center mb-4">
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
          </div>

          {/* Area scrollable untuk konten utama */}
          <div className="flex-grow overflow-y-auto px-6 pb-2 custom-scrollbar">
            {/* Informasi Transaksi */}
            <div className="bg-green-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-green-800 mb-2">Informasi Transaksi</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center text-sm text-gray-700">
                  <Calendar className="w-4 h-4 mr-2 text-green-600" />
                  <span>
                    {receiptData.transactionDate.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <Clock className="w-4 h-4 mr-2 text-green-600" />
                  <span>
                    {receiptData.transactionDate.toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
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

                {/* Tambahkan informasi poin jika customer adalah member */}
                {receiptData.customerId && calculateEarnedPoints() > 0 && (
                  <div className="flex items-center text-sm text-green-700 col-span-2">
                    <Coins className="w-4 h-4 mr-2 text-green-600" />
                    <span>Poin Didapat: {calculateEarnedPoints()} poin</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Pesanan */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center sticky top-0 bg-white py-2">
                <ShoppingBag className="w-4 h-4 mr-2 text-green-600" />
                Detail Pesanan
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-10">
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
                                    <span className="text-red-600 font-medium">Hemat: {formatCurrency(item.discountAmount || 0)}</span>
                                  </div>
                                )}
                                {item.promotionDetails && <div className="text-red-600 font-medium mt-1">{item.promotionDetails}</div>}
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

            {/* Ringkasan Pembayaran */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              {/* Tampilkan total hemat dari diskon promosi */}
              {calculateTotalSavings() > 0 && (
                <div className="flex justify-between mb-2 text-red-600">
                  <span>Total Hemat dari Promosi:</span>
                  <span className="font-medium">{formatCurrency(calculateTotalSavings())}</span>
                </div>
              )}

              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal setelah promosi:</span>
                <span className="font-medium">{formatCurrency(receiptData.totalBeforePointsDiscount || receiptData.finalTotal)}</span>
              </div>

              {/* Informasi redeem poin jika ada */}
              {receiptData.redeemedPoints && receiptData.redeemedPoints > 0 && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>Potongan Poin Member:</span>
                  <span className="font-medium">-{formatCurrency(receiptData.redeemedPoints)}</span>
                </div>
              )}

              <div className="flex justify-between mb-2 font-medium border-t border-dashed pt-2">
                <span className="text-gray-800">Total Pembayaran:</span>
                <span>{formatCurrency(receiptData.finalTotal)}</span>
              </div>

              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tunai:</span>
                <span>{formatCurrency(receiptData.amountReceived)}</span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span className="text-gray-800">Kembali:</span>
                <span className="text-green-700">{formatCurrency(receiptData.change)}</span>
              </div>

              {/* Tambahkan informasi poin jika customer adalah member */}
              {receiptData.customerId && (
                <div className="mt-3 pt-3 border-t border-dashed">
                  {calculateEarnedPoints() > 0 && (
                    <div className="flex justify-between text-sm text-green-700">
                      <span>Poin yang didapat:</span>
                      <span className="font-medium">{calculateEarnedPoints()} poin</span>
                    </div>
                  )}

                  {receiptData.redeemedPoints && receiptData.redeemedPoints > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 mt-1">
                      <span>Poin yang ditukarkan:</span>
                      <span className="font-medium">{receiptData.redeemedPoints} poin</span>
                    </div>
                  )}

                  {/* Tambahkan informasi aturan poin member */}
                  <div className="mt-2 text-xs text-gray-500 border-t border-dashed pt-2">
                    <p className="font-medium">Informasi Poin Member:</p>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      <li>Setiap transaksi Rp200 = 1 poin</li>
                      <li>1 poin = Rp1 untuk penukaran</li>
                      <li>Minimal penukaran 1.000 poin</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer tetap */}
          <div className="px-6 pb-6 pt-2 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={handleDownloadPDF}
                className="bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Download className="w-5 h-5" />
                Download Struk
              </button>
              <button onClick={onClose} className="bg-gray-800 text-white py-3 rounded-lg hover:bg-black transition-colors font-medium">
                Tutup
              </button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <p>
                {storeName} | {storeAddress}
              </p>
              <p className="mt-1">Terima kasih atas kunjungan Anda</p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

