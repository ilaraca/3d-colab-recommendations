import { NextResponse } from 'next/server';
import { getMethodLessons } from '@/lib/recommendations/education-traces';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ lessons: getMethodLessons() });
  } catch (error) {
    console.error('Learn method traces API error:', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar a execução guiada' },
      { status: 500 }
    );
  }
}
