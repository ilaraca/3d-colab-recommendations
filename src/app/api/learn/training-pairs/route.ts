import { NextRequest, NextResponse } from 'next/server';
import { getLearnTrainingPairs } from '@/lib/recommendations/learn-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const limit = request.nextUrl.searchParams.get('limit')
      ? parseInt(request.nextUrl.searchParams.get('limit')!, 10)
      : 24;

    const data = await getLearnTrainingPairs(limit);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Training pairs API error:', error);
    return NextResponse.json({ error: 'Failed to load training pairs' }, { status: 500 });
  }
}
