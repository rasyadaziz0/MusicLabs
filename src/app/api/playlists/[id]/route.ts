import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type UpdatePlaylistBody = {
  name?: string;
  description?: string;
  coverUrl?: string;
  isPublic?: boolean;
};

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get('authorization') ?? '';
  const [scheme, token] = authorization.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as UpdatePlaylistBody;
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Playlist name is required' }, { status: 400 });
    }

    const payload: any = {
      name,
      description: body.description?.trim() || null,
      cover_url: body.coverUrl?.trim() || null,
    };

    if (body.isPublic !== undefined) {
      payload.is_public = body.isPublic;
    }

    const { data, error } = await supabase
      .from('playlists')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, user_id, name, description, cover_url, created_at')
      .single();

    if (error) {
      console.error('Playlist update error:', error.message);
      return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}
