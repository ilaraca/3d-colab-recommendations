import { NextRequest, NextResponse } from 'next/server';
import { getLearnVectors } from '@/lib/recommendations/learn-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get('email');
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const vectors = await getLearnVectors(email);
    if (!vectors) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(vectors);
  } catch (error) {
    console.error('Learn vectors API error:', error);
    return NextResponse.json({ error: 'Failed to load vectors' }, { status: 500 });
  }
}
