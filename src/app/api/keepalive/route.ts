import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Tiny uncached query so each monitor ping counts as DB activity.
    const { error } = await supabase.from('Lead').select('id').limit(1).maybeSingle();

    if (error) {
      console.error('Keepalive query error:', error);
      return NextResponse.json(
        { ok: false, error: 'Database check failed' },
        {
          status: 500,
          headers: {
            'Cache-Control': 'no-store, max-age=0',
          },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    console.error('Keepalive endpoint error:', error);
    return NextResponse.json(
      { ok: false, error: 'Keepalive failed' },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }
}
