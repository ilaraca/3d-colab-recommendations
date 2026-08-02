import { NextResponse } from 'next/server';
import { getLearnDemoUsers } from '@/lib/recommendations/learn-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const users = await getLearnDemoUsers();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Learn demo users API error:', error);
    return NextResponse.json({ error: 'Failed to load demo users' }, { status: 500 });
  }
}
