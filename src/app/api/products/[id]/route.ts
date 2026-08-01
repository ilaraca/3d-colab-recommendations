import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid product id' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar_url: true } },
        images: true,
        stl_file: true,
        reviews: { select: { rating: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length
        : 0;

    return NextResponse.json({
      ...product,
      price: Number(product.price),
      user: { ...product.user, rating: avgRating },
    });
  } catch (error) {
    console.error('Product API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
