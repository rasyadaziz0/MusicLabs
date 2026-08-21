import { StatusChecker } from '@/lib/services/StatusChecker';
import { NextResponse } from 'next/server';

export const revalidate = 30; // Cache status check globally for 30 seconds

const checker = new StatusChecker();

export async function GET() {
  try {
    const report = await checker.run();
    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=59',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json(
      {
        overall: 'outage' as const,
        timestamp: new Date().toISOString(),
        components: [],
        error: message,
      },
      { status: 500 },
    );
  }
}
