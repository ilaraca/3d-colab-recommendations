import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRecommendations } from '@/lib/recommendations/recommend';
import type { RecommendationMode } from '@/lib/recommendations/constants';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : undefined;
    const mode = (searchParams.get('mode') as RecommendationMode) || undefined;
    const productId = searchParams.get('productId')
      ? parseInt(searchParams.get('productId')!, 10)
      : undefined;
    const excludeIds = searchParams.get('excludeIds') || undefined;

    if (mode === 'similar' && !productId) {
      return NextResponse.json(
        { error: 'productId is required when mode=similar' },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id, 10) : undefined;

    const result = await getRecommendations({
      userId,
      mode: mode ?? (userId ? 'personalized' : 'popular'),
      productId,
      limit,
      excludeIds,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
