"use client"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Printer } from "lucide-react"
import { formatRupiah } from "@/lib/formatIdr"

interface TransactionSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  transactionData: {
    orderId: string
    date: string
    items: Array<{ name: string; quantity: number; price: number }>
    subtotal: number
    discount: number
    total: number
    cashier: string
    customerName: string
  }
}

export function TransactionSuccessModal({ isOpen, onClose, transactionData }: TransactionSuccessModalProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 10000) // Close after 10 seconds

      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-white border-4 border-black p-6 max-w-md w-full mx-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center"
              >
                <Check className="text-white" size={40} />
              </motion.div>
              <h2 className="text-2xl font-bold mt-4">Transaction Successful!</h2>
            </div>

            <div className="border-2 border-black p-4 mb-4 font-mono text-sm">
              <div className="text-center font-bold text-lg mb-2">RECEIPT</div>
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span>{transactionData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{transactionData.date}</span>
              </div>
              <div className="border-t-2 border-black my-2"></div>
              {transactionData.items.map((item, index) => (
                <div key={index} className="flex justify-between">
                  <span>
                    {item.name} x{item.quantity}
                  </span>
                  <span>{formatRupiah(item.price * item.quantity)}</span>
                </div>
              ))}
              <div className="border-t-2 border-black my-2"></div>
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatRupiah(transactionData.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span>-{formatRupiah(transactionData.discount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatRupiah(transactionData.total)}</span>
              </div>
              <div className="border-t-2 border-black my-2"></div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{transactionData.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span>{transactionData.customerName}</span>
              </div>
              <div className="text-center mt-4">Thank you for your purchase!</div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={handlePrint}
                disabled={isPrinting}
                className="px-4 py-2 bg-[#FFD700] font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                           active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center"
              >
                <Printer className="mr-2" size={20} />
                {isPrinting ? "Printing..." : "Print Receipt"}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white font-bold border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                           active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

