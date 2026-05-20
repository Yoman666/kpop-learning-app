import { NextRequest, NextResponse } from "next/server";

import {
  fetchYouTubeOEmbed,
  searchLyricsFromWeb,
  splitLyricLines,
  translateKoreanLinesToChinese,
} from "@/lib/lyrics-service";

export const dynamic = "force-dynamic";

const VIDEO_ID_RE = /^[\w-]{11}$/;

export async function GET(req: NextRequest) {
  const videoId = req.nextUrl.searchParams.get("videoId")?.trim() ?? "";
  if (!VIDEO_ID_RE.test(videoId)) {
    return NextResponse.json({ error: "Invalid videoId" }, { status: 400 });
  }

  const meta = await fetchYouTubeOEmbed(videoId);
  if (!meta) {
    return NextResponse.json(
      { error: "Could not read this video’s title from YouTube." },
      { status: 502 }
    );
  }

  const match = await searchLyricsFromWeb(meta);
  if (!match) {
    return NextResponse.json(
      {
        error:
          "No lyrics found for this title. Try another official audio or MV, or a popular release.",
        videoTitle: meta.title,
        channelTitle: meta.authorName,
      },
      { status: 404 }
    );
  }

  const koreanLines = splitLyricLines(match.plainLyrics).slice(0, 56);
  if (koreanLines.length === 0) {
    return NextResponse.json(
      {
        error: "Lyrics record had no readable text.",
        videoTitle: meta.title,
        channelTitle: meta.authorName,
      },
      { status: 404 }
    );
  }

  const chineseLines = await translateKoreanLinesToChinese(koreanLines);

  return NextResponse.json({
    videoTitle: meta.title,
    channelTitle: meta.authorName,
    trackName: match.trackName,
    artistName: match.artistName,
    albumName: match.albumName,
    source: match.source,
    koreanLines,
    chineseLines,
  });
}
