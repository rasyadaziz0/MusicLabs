import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateDiscoverWeeklyForUser } from '@/services/discover/discoverService';

export const runtime = 'nodejs';
// Allow maximum duration since this might process many users
export const maxDuration = 300; 

// We need the service role key to fetch all profiles, bypassing RLS
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: Request) {
  try {
    // 1. Verify cron secret to prevent unauthorized execution
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.warn('Missing SUPABASE_SERVICE_ROLE_KEY for cron job');
      return NextResponse.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 2. Fetch all user profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id');

    if (profileError) {
      throw new Error(`Failed to fetch profiles: ${profileError.message}`);
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ message: 'No users found' });
    }

    const results = {
      totalUsers: profiles.length,
      successCount: 0,
      skippedCount: 0,
      failedCount: 0,
      errors: [] as any[],
    };

    // 3. Process each user sequentially to avoid overwhelming Gemini/iTunes APIs
    for (const profile of profiles) {
      try {
        await generateDiscoverWeeklyForUser(supabaseAdmin, profile.id);
        results.successCount++;
      } catch (err: any) {
        if (err.message === 'insufficient_history') {
          results.skippedCount++;
        } else {
          results.failedCount++;
          results.errors.push({ userId: profile.id, error: err.message });
          console.error(`Discover Weekly generation failed for user ${profile.id}:`, err);
        }
      }
    }

    return NextResponse.json({
      message: 'Discover Weekly generation completed',
      results,
    });
  } catch (err: any) {
    console.error('Discover Weekly cron error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to execute Discover Weekly cron job' },
      { status: 500 }
    );
  }
}
