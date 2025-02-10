// app/receipts/[transactionId]/page.tsx
import { getReceiptById } from "@/server/actions";
import { notFound } from "next/navigation";

export default async function ReceiptPage({
  params,
}: {
  params: { transactionId: string };
}) {
  const receipt = await getReceiptById(params.transactionId);

  if (!receipt) {
    notFound();
  }

  // Redirect to PDF if it exists
  if (receipt.pdfUrl) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4">Your Receipt</h1>
        <p className="text-gray-600 mb-8">
          Transaction ID: {receipt.transactionId}
        </p>
        <iframe
          src={receipt.pdfUrl}
          className="w-full max-w-2xl h-[800px] border rounded-lg"
        />
        <a
          href={receipt.pdfUrl}
          download={`receipt-${receipt.transactionId}.pdf`}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Download PDF
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Receipt Not Found</h1>
        <p className="text-gray-600">
          The receipt you're looking for could not be found.
        </p>
      </div>
    </div>
  );
}