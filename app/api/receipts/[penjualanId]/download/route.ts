// app/api/receipts/[penjualanId]/download/route.ts
import { NextResponse } from 'next/server';
import jsPDF from 'jspdf';
import { prisma } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { penjualanId: string } }
) {
  try {
    const id = params.penjualanId;

    if (!id) {
      return NextResponse.json(
        { message: 'Invalid transaction ID' },
        { status: 400 }
      );
    }

    // Fetch transaction data from database
    const transaction = await prisma.penjualan.findUnique({
      where: {
        penjualanId: Number(id)
      },
      include: {
        pelanggan: true,
        detailPenjualan: {
          select: {
            detailId: true,
            kuantitas: true,
            penjualan: true,
            penjualanId: true,
            produk: true,
            produkId: true,
            subtotal: true,
          }
        },
        user: true,
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Generate PDF
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text('Bukti Transaksi', 105, 20, { align: 'center' });

    // Store Info
    doc.setFontSize(16);
    doc.text('Suta Cake', 105, 35, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Jl.Manuggal IV, Sukatali', 105, 45, { align: 'center' });
    doc.text('Telp: 098987765', 105, 55, { align: 'center' });

    // Transaction Details
    doc.text(`No. Transaksi: ${transaction.penjualanId}`, 20, 70);
    doc.text(`Tanggal: ${new Date(transaction.tanggalPenjualan).toLocaleDateString("id-ID")}`, 20, 80);
    doc.text(`Pelanggan: ${transaction.pelanggan?.nama || "Guest"}`, 20, 90);

    // Items
    let yPos = 110;
    doc.text('Detail Pesanan:', 20, 100);

    transaction.detailPenjualan.forEach((item) => {
      doc.text(`${item.produk.nama} x${item.kuantitas}`, 20, yPos);
      doc.text(new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(item.subtotal), 150, yPos);
      yPos += 10;
    });

    // Totals
    yPos += 10;
    doc.text('Total:', 20, yPos);
    doc.text(new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(transaction.total_harga), 150, yPos);

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    // Create response with appropriate headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=receipt-${id}.pdf`
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { message: 'Error generating PDF' },
      { status: 500 }
    );
  }
}