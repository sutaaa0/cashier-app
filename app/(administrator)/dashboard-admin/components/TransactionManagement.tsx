"use client";

import { useState, useEffect } from "react";
import { FileText, Eye, Download, Calendar, RefreshCw, CreditCard } from "lucide-react";
import { getTransactions } from "@/server/actions";
import { toast } from "@/hooks/use-toast";
import { ViewTransactionModal } from "./ViewTransactionModal";
import { NeoProgressIndicator } from "@/components/NeoProgresIndicator";
import * as XLSX from "xlsx";
import { formatRupiah } from "@/lib/formatIdr";

interface PromotionInfo {
  title: string;
  discountPercentage: number | null;
  discountAmount: number | null;
}

interface DetailPenjualanWithPromotion {
  produk: { 
    nama: string 
  };
  promotion?: PromotionInfo;
  subtotal: number;
  kuantitas: number;
}

interface RefundInfo {
  refundId: number;
  tanggalRefund: Date;
  totalRefund: number;
  detailRefund: Array<{
    produk: { nama: string };
    kuantitas: number;
  }>;
}

interface TransactionData {
  penjualanId: number;
  tanggalPenjualan: Date;
  total_harga: number;
  pelanggan?: { nama: string } | null;
  guest?: { guestId: number } | null;
  detailPenjualan: DetailPenjualanWithPromotion[];
  returns: RefundInfo[];
  diskonPoin: number | null;
}

export function TransactionManagement() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionData | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const result = await getTransactions();
      if (result.status === "Success") {
        setTransactions(result.data ?? []);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch transactions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "An error occurred while fetching transactions",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const convertToExcelData = (transactions: TransactionData[]) => {
    return transactions.map((transaction) => {
      // Prepare details with promotions
      const itemsWithPromotion = transaction.detailPenjualan.map((detail) => {
        const promotionInfo = detail.promotion 
          ? `${detail.produk.nama} (${detail.promotion.title}: ${detail.promotion.discountPercentage ? detail.promotion.discountPercentage + '% off' : formatRupiah(detail.promotion.discountAmount || 0)})`
          : detail.produk.nama;
        return promotionInfo;
      }).join(", ");

      // Prepare refund information
      const refundInfo = transaction.returns.length > 0 
        ? transaction.returns.map(refund => 
            `Refund #${refund.refundId} on ${new Date(refund.tanggalRefund).toLocaleString()} - ${formatRupiah(refund.totalRefund)}`
          ).join("; ")
        : "No Refunds";

      // Add point discount information
      const pointDiscountInfo = transaction.diskonPoin ? 
        `Points Discount: ${formatRupiah(transaction.diskonPoin)}` : 
        "No Points Discount";

      return {
        "Transaction ID": transaction.penjualanId,
        Date: new Date(transaction.tanggalPenjualan).toLocaleString(),
        Total: formatRupiah(transaction.total_harga),
        Customer: transaction.pelanggan ? transaction.pelanggan.nama : `Guest ${transaction.guest?.guestId}`,
        "Points Discount": transaction.diskonPoin ? formatRupiah(transaction.diskonPoin) : "0",
        Items: itemsWithPromotion,
        Refunds: refundInfo
      };
    });
  };

  const handleExportData = () => {
    const excelData = convertToExcelData(transactions);
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    // Create download link
    const url = window.URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Transactions_${new Date().toISOString().split("T")[0]}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewTransaction = (transaction: TransactionData) => {
    setSelectedTransaction(transaction);
    setIsViewModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black">TRANSACTION HISTORY</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTransactions}
            className="p-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
          >
            <RefreshCw size={20} />
          </button>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-[#93B8F3] font-bold border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2"
          >
            <Download size={20} />
            Export to Excel
          </button>
        </div>
      </div>
      <div className="grid gap-4">
        {transactions.map((transaction) => (
          <div key={transaction.penjualanId} className="bg-white border-[3px] border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#93B8F3] border-[3px] border-black">
                  <FileText size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Transaction #{transaction.penjualanId}</h3>
                    {transaction.returns.length > 0 && (
                      <span className="text-red-500 text-sm">
                        ({transaction.returns.length} Refund{transaction.returns.length > 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="flex items-center text-sm">
                      <Calendar size={16} className="mr-1" />
                      {new Date(transaction.tanggalPenjualan).toLocaleDateString()}
                    </span>
                    <span className="flex items-center text-sm font-bold">{formatRupiah(transaction.total_harga)}</span>
                    {transaction.diskonPoin && transaction.diskonPoin > 0 && (
                      <span className="flex items-center text-sm text-green-600">
                        <CreditCard size={16} className="mr-1" />
                        Points: -{formatRupiah(transaction.diskonPoin)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1">
                    {transaction.pelanggan ? transaction.pelanggan.nama : `Guest ${transaction.guest?.guestId}`} • {transaction.detailPenjualan.length} items
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleViewTransaction(transaction)}
                  className="p-2 bg-[#93B8F3] border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedTransaction && (
        <ViewTransactionModal 
          isOpen={isViewModalOpen} 
          onClose={() => setIsViewModalOpen(false)} 
          transaction={selectedTransaction} 
        />
      )}
      <NeoProgressIndicator isLoading={isLoading} message="Fetching transactions..." />
    </div>
  );
}