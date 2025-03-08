import React from "react";
import { X, Calendar, DollarSign, User, ShoppingBag, RefreshCw, CreditCard } from "lucide-react";
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
  subtotal: number;
  kuantitas: number;
  promotion?: PromotionInfo;
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

interface ViewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    penjualanId: number;
    tanggalPenjualan: Date;
    total_harga: number;
    pelanggan?: { nama: string } | null;
    guest?: { guestId: number } | null;
    detailPenjualan: DetailPenjualanWithPromotion[];
    returns: RefundInfo[];
    diskonPoin: number | null;
  };
}

export function ViewTransactionModal({ isOpen, onClose, transaction }: ViewTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white border-[3px] border-black p-6 rounded-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-3xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Transaction Details</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded">
            <X size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Transaction Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar size={20} />
              <span>Date: {new Date(transaction.tanggalPenjualan).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={20} />
              <span>Total: {formatRupiah(transaction.total_harga)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={20} />
              <span>Customer: {transaction.pelanggan ? transaction.pelanggan.nama : `Guest ${transaction.guest?.guestId}`}</span>
            </div>
            {transaction.diskonPoin && transaction.diskonPoin > 0 && (
              <div className="flex items-center gap-2 text-green-600">
                <CreditCard size={20} />
                <span>Points Discount: {formatRupiah(transaction.diskonPoin)}</span>
              </div>
            )}
          </div>

          {/* Items Section */}
          <div>
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <ShoppingBag size={20} />
              Items:
            </h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="p-2 text-left">Product</th>
                  <th className="p-2 text-right">Quantity</th>
                  <th className="p-2 text-right">Subtotal</th>
                  <th className="p-2 text-left">Promotion</th>
                </tr>
              </thead>
              <tbody>
                {transaction.detailPenjualan.map((detail, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{detail.produk.nama}</td>
                    <td className="p-2 text-right">{detail.kuantitas}</td>
                    <td className="p-2 text-right">{formatRupiah(detail.subtotal)}</td>
                    <td className="p-2">
                      {detail.promotion ? (
                        <div>
                          {detail.promotion.title}
                          {detail.promotion.discountPercentage && ` (${detail.promotion.discountPercentage}% off)`}
                          {detail.promotion.discountAmount && ` (${formatRupiah(detail.promotion.discountAmount)} off)`}
                        </div>
                      ) : (
                        <span className="text-gray-500">No promotion</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Discount Points Summary */}
          {transaction.diskonPoin && transaction.diskonPoin > 0 && (
            <div className="bg-green-50 p-3 border border-green-200 rounded">
              <div className="flex items-center gap-2">
                <CreditCard size={20} className="text-green-600" />
                <h3 className="font-bold text-green-700">Points Discount Applied</h3>
              </div>
              <p className="mt-1 text-green-700">
                {formatRupiah(transaction.diskonPoin)} discount from redeemed points
              </p>
            </div>
          )}

          {/* Refund Section */}
          {transaction.returns.length > 0 && (
            <div>
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <RefreshCw size={20} className="text-red-500" />
                Refund History:
              </h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="p-2 text-left">Refund ID</th>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-right">Total Refund</th>
                    <th className="p-2 text-left">Refunded Items</th>
                  </tr>
                </thead>
                <tbody>
                  {transaction.returns.map((refund) => (
                    <tr key={refund.refundId} className="border-b">
                      <td className="p-2">#{refund.refundId}</td>
                      <td className="p-2">{new Date(refund.tanggalRefund).toLocaleString()}</td>
                      <td className="p-2 text-right text-red-500">{formatRupiah(refund.totalRefund)}</td>
                      <td className="p-2">
                        <ul className="list-disc list-inside">
                          {refund.detailRefund.map((detail, itemIndex) => (
                            <li key={itemIndex}>
                              {detail.produk.nama} (Qty: {detail.kuantitas})
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}