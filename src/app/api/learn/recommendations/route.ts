import { NextRequest, NextResponse } from 'next/server';
import type { RecommendationSource } from '@/lib/recommendations/constants';
import { resolveDemoUserId } from '@/lib/recommendations/learn-data';
import { ModelNotFoundError } from '@/lib/recommendations/ml-recommend';
import { getRecommendations } from '@/lib/recommendations/recommend';

export const dynamic = 'force-dynamic';

const VALID_SOURCES: RecommendationSource[] = ['auto', 'ml', 'content'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const sourceParam = searchParams.get('source') as RecommendationSource | null;
    const source =
      sourceParam && VALID_SOURCES.includes(sourceParam) ? sourceParam : 'content';
    const limit = searchParams.get('limit')
      ? parseInt(searchParams.get('limit')!, 10)
      : 6;

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const userId = await resolveDemoUserId(email);
    if (!userId) {
      return NextResponse.json(
        { error: 'Only demo buyer emails are allowed in the lab' },
        { status: 400 }
      );
    }

    const result = await getRecommendations({
      userId,
      mode: 'personalized',
      source,
      limit,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ModelNotFoundError) {
      return NextResponse.json(
        {
          error:
            'Modelo ML não encontrado. Rode npm run recommendations:train ou treine no playground.',
        },
        { status: 503 }
      );
    }

    console.error('Learn recommendations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
