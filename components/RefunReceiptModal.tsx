"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"

const formatRupiah = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(amount)
}

interface RefundReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  data: {
    transactionDetails: any
    returnedItems: {
      produkId: number
      nama: string
      kuantitas: number
      harga: number
    }[]
    replacementItems: {
      produkId: number
      nama: string
      kuantitas: number
      harga: number
    }[]
    totalReturn: number
    totalReplacement: number
    additionalPayment: number
  }
}

export function RefundReceiptModal({ isOpen, onClose, data }: RefundReceiptModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true)
      // Trigger confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }, [isOpen])

  if (!data?.transactionDetails) {
    console.log("No transaction details available:", data)
    return null
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: {
        ease: "easeInOut",
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        setIsVisible(false)
        setTimeout(onClose, 300)
      }}
    >
      <AnimatePresence>
        {isVisible && (
          <DialogContent className="max-w-[500px] font-mono bg-white p-0 overflow-hidden">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-700 opacity-20" />
              <div className="relative z-10 p-6">
                <DialogHeader>
                  <DialogTitle className="text-center text-3xl font-black mb-4 text-yellow-600 shadow-yellow-400 drop-shadow-lg">
                    Nota Pengembalian
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Header Info */}
                  <motion.div
                    variants={itemVariants}
                    className="text-center border-4 border-black py-4 bg-yellow-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <h2 className="font-black text-2xl mb-2">TOKO BERKAH</h2>
                    <p className="text-sm">Jl. Contoh No. 123, Kota</p>
                    <p className="text-sm">Telp: (021) 123-4567</p>
                  </motion.div>

                  {/* Transaction Details */}
                  <motion.div
                    variants={itemVariants}
                    className="space-y-1 text-sm border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <p>
                      No. Transaksi: <span className="font-bold">{data.transactionDetails.penjualanId}</span>
                    </p>
                    <p>
                      Tanggal:{" "}
                      <span className="font-bold">
                        {format(new Date(data.transactionDetails.tanggalPenjualan), "dd MMMM yyyy HH:mm", {
                          locale: id,
                        })}
                      </span>
                    </p>
                    <p>
                      Kasir: <span className="font-bold">{data.transactionDetails.user?.username || "Admin"}</span>
                    </p>
                  </motion.div>

                  {/* Returned Items */}
                  <motion.div
                    variants={itemVariants}
                    className="space-y-2 border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <h3 className="font-black text-lg border-b-2 border-black pb-2">Barang yang Dikembalikan:</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-black">
                          <th className="text-left py-2">Item</th>
                          <th className="text-right py-2">Qty</th>
                          <th className="text-right py-2">Harga</th>
                          <th className="text-right py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.returnedItems.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-200">
                            <td className="py-2">{item.nama}</td>
                            <td className="text-right py-2">{item.kuantitas}</td>
                            <td className="text-right py-2">{formatRupiah(item.harga)}</td>
                            <td className="text-right py-2">{formatRupiah(item.harga * item.kuantitas)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="text-right font-bold mt-2">Total Pengembalian: {formatRupiah(data.totalReturn)}</p>
                  </motion.div>

                  {/* Replacement Items */}
                  {data.replacementItems.length > 0 && (
                    <motion.div
                      variants={itemVariants}
                      className="space-y-2 border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    >
                      <h3 className="font-black text-lg border-b-2 border-black pb-2">Barang Pengganti:</h3>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="text-left py-2">Item</th>
                            <th className="text-right py-2">Qty</th>
                            <th className="text-right py-2">Harga</th>
                            <th className="text-right py-2">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.replacementItems.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-200">
                              <td className="py-2">{item.nama}</td>
                              <td className="text-right py-2">{item.kuantitas}</td>
                              <td className="text-right py-2">{formatRupiah(item.harga)}</td>
                              <td className="text-right py-2">{formatRupiah(item.harga * item.kuantitas)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <p className="text-right font-bold mt-2">
                        Total Penggantian: {formatRupiah(data.totalReplacement)}
                      </p>
                    </motion.div>
                  )}

                  {/* Payment Summary */}
                  <motion.div
                    variants={itemVariants}
                    className="border-4 border-black pt-4 space-y-2 bg-yellow-100 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
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
                      <span>{formatRupiah(data.totalReplacement - data.totalReturn)}</span>
                    </div>
                  </motion.div>

                  {/* Footer */}
                  <motion.div
                    variants={itemVariants}
                    className="text-center text-sm pt-4 space-y-2 bg-yellow-200 p-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <p className="font-bold">Barang yang sudah dibeli/ditukar</p>
                    <p className="font-bold">tidak dapat dikembalikan</p>
                    <p className="font-black text-lg mt-4">Terima Kasih</p>
                    <p className="font-bold">Atas kunjungan anda</p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  )
}

