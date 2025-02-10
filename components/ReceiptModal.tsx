"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CheckCircle2, 
  Download, 
  Printer, 
  QrCode,
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateAndSaveReceipt } from "@/server/actions";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ReceiptModalProps {
  receiptData: {
    penjualanId: number;
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
    }>;
    transactionDate: Date;
  };
  onClose: () => void;
}

export default function ReceiptModal({ receiptData, onClose }: ReceiptModalProps) {
  const [customerName, setCustomerName] = useState<string>(
    receiptData.customerName || "Guest"
  );
  const [transactionId] = useState(
    `TRX${Date.now().toString(36).toUpperCase()}`
  );
  const [showQR, setShowQR] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const handleGenerateReceipt = async () => {
    setIsGenerating(true);
    try {
      const result = await generateAndSaveReceipt(
        {
          ...receiptData,
          customerName,
        },
        transactionId
      );

      if (result.success && result.receipt) {
        const receiptViewUrl = `${window.location.origin}/receipts/${transactionId}`;
        setReceiptUrl(receiptViewUrl);
        toast({
          title: "Success",
          description: "Receipt generated successfully",
        });
      } else {
        throw new Error(result.error || "Failed to generate receipt");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate receipt",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintReceipt = async () => {
    if (!receiptUrl) return;
    
    setIsPrinting(true);
    try {
      const response = await fetch(receiptUrl);
      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      
      const printWindow = window.open(pdfUrl, "_blank");
      printWindow?.print();
      
      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
        printWindow?.close();
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to print receipt",
        variant: "destructive",
      });
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-[400px] p-6 rounded-lg shadow-xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="text-green-500 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold">Payment Success!</h2>
          <p className="text-gray-500 mt-1">Transaction completed successfully</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Reference Number</p>
                <p className="font-medium">{transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date & Time</p>
                <p className="font-medium">
                  {new Date(receiptData.transactionDate).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Amount</p>
                <p className="font-medium text-green-600">
                  {formatCurrency(receiptData.finalTotal)}
                </p>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showQR && receiptUrl && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col items-center p-4 bg-white border rounded-lg"
              >
                <QRCodeSVG
                  value={receiptUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Scan to view digital receipt
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => setShowQR(!showQR)}
            className={cn(
              "w-full h-11 flex items-center justify-center gap-2",
              !receiptUrl && "opacity-50 cursor-not-allowed"
            )}
            disabled={!receiptUrl}
          >
            <QrCode size={20} />
            {showQR ? "Hide QR Code" : "Show QR Code"}
          </Button>

          <Button
            onClick={handleGenerateReceipt}
            disabled={isGenerating}
            variant="outline"
            className="w-full h-11 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download size={20} />
            )}
            {isGenerating ? "Generating..." : "Generate Receipt"}
          </Button>

          <Button
            onClick={handlePrintReceipt}
            disabled={!receiptUrl || isPrinting}
            variant="outline"
            className="w-full h-11 flex items-center justify-center gap-2"
          >
            {isPrinting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Printer size={20} />
            )}
            {isPrinting ? "Printing..." : "Print Receipt"}
          </Button>

          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full h-11"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}