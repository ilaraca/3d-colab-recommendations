import { NextResponse } from 'next/server';
import { getLearnDataset } from '@/lib/recommendations/learn-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dataset = await getLearnDataset();
    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Learn dataset API error:', error);
    return NextResponse.json({ error: 'Failed to load dataset' }, { status: 500 });
  }
}
