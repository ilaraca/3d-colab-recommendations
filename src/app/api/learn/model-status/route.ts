import { NextResponse } from 'next/server';
import { getLearnModelStatus } from '@/lib/recommendations/learn-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getLearnModelStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Learn model status API error:', error);
    return NextResponse.json({ error: 'Failed to load model status' }, { status: 500 });
  }
}
