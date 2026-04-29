import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

interface DeezerArtistResponse {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  nb_album: number;
  nb_fan: number;
  type: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ data: null }, { status: 400 });
  }

  try {
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      return NextResponse.json({ data: null }, { status: 400 });
    }

    const res = await fetch(`https://api.deezer.com/artist/${numericId}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      return NextResponse.json({ data: null }, { status: res.status });
    }

    const artist: DeezerArtistResponse = await res.json();

    return NextResponse.json({
      data: {
        id: artist.id,
        name: artist.name,
        link: artist.link,
        picture: artist.picture_xl || artist.picture_big || artist.picture_medium || '',
        picture_small: artist.picture_small,
        picture_medium: artist.picture_medium,
        picture_big: artist.picture_big,
        picture_xl: artist.picture_xl,
        nb_album: artist.nb_album,
        nb_fan: artist.nb_fan,
      },
    });
  } catch (error) {
    console.error('Artist info failed:', error);
    return NextResponse.json({ data: null }, { status: 500 });
  }
}
