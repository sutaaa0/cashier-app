// app/api/receipts/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.transactionId || !data.penjualanId || !data.finalTotal || !data.orderItems) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if receipt already exists
    const existingReceipt = await prisma.receipt.findUnique({
      where: {
        transactionId: data.transactionId,
      },
    });

    if (existingReceipt) {
      return NextResponse.json(
        { error: 'Receipt already exists' },
        { status: 409 }
      );
    }

    // Create PDF blob
    const pdfBlob = new Blob([new Uint8Array(data.pdfBuffer)], {
      type: 'application/pdf'
    });
    
    const filename = `receipts/${data.transactionId}.pdf`;
    const blob = await put(filename, pdfBlob, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Create receipt record with proper type casting
    const receipt = await prisma.receipt.create({
      data: {
        transactionId: data.transactionId,
        penjualanId: data.penjualanId,
        total: data.finalTotal,
        customerName: data.customerName || 'Guest',
        petugasId: data.petugasId,
        items: data.orderItems as any, // Cast to any since items is Json type
        pdfUrl: blob.url,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Verify receipt was created
    if (!receipt) {
      throw new Error('Failed to create receipt record');
    }

    // Update the associated Penjualan record
    await prisma.penjualan.update({
      where: {
        penjualanId: data.penjualanId,
      },
      data: {
        receipt: {
          connect: {
            id: receipt.id,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      receipt: {
        id: receipt.id,
        transactionId: receipt.transactionId,
        pdfUrl: receipt.pdfUrl,
      },
    });

  } catch (error) {
    console.error('Error storing receipt:', error);
    
    // Return detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? (error as Error).message 
      : 'Failed to store receipt';
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}