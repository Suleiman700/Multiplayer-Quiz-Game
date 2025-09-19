import { NextResponse } from 'next/server';
import { AdminDB } from '@/lib/admin-db';

export async function GET() {
  try {
    const stats = await AdminDB.getStatistics();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
