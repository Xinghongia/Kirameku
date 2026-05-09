import { NextRequest, NextResponse } from "next/server";
import Meting from "@meting/core";

interface SongData {
  id: string;
  title: string;
  artist: string;
  cover: string;
  src: string;
  lrcUrl: string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("id");
  const songIds = searchParams.get("ids");

  if (!playlistId && !songIds) {
    return NextResponse.json(
      { error: "需要提供 id (歌单ID) 或 ids (歌曲ID,逗号分隔)" },
      { status: 400 }
    );
  }

  const meting = new Meting("netease");
  meting.format(true);

  try {
    let tracks: { id: string; name: string; artist: string[]; pic_id: string; url_id: string; lyric_id: string }[] = [];

    if (playlistId) {
      const raw = await meting.playlist(playlistId);
      const parsed = JSON.parse(raw as string);
      tracks = Array.isArray(parsed) ? parsed : [];
    } else if (songIds) {
      const ids = songIds.split(",").map((s) => s.trim()).filter(Boolean);
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const raw = await meting.song(id);
            const parsed = JSON.parse(raw as string);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [];
          }
        })
      );
      tracks = results.flat();
    }

    // 批量获取 URL
    const songs: SongData[] = await Promise.all(
      tracks.map(async (track) => {
        let src = "";
        try {
          const urlRaw = await meting.url(track.url_id, 320);
          const urlData = JSON.parse(urlRaw as string);
          src = (urlData.url || "").replace(/^http:\/\//, "https://");
        } catch {
          // ignore
        }

        let cover = "";
        try {
          const picRaw = await meting.pic(track.pic_id, 300);
          const picData = JSON.parse(picRaw as string);
          cover = (picData.url || "").replace(/^http:\/\//, "https://");
        } catch {
          // ignore
        }

        return {
          id: String(track.id),
          title: track.name || "未知歌曲",
          artist: Array.isArray(track.artist) ? track.artist.join(", ") : String(track.artist || "未知歌手"),
          cover,
          src,
          lrcUrl: track.lyric_id ? `https://api.injahow.cn/meting/?server=netease&type=lrc&id=${track.lyric_id}` : "",
        };
      })
    );

    return NextResponse.json(songs.filter((s) => s.src));
  } catch (err) {
    console.error("Meting error:", err);
    return NextResponse.json(
      { error: "获取音乐数据失败" },
      { status: 500 }
    );
  }
}
