import { spotifyConfig, SPOTIFY_TOP_TRACKS_LIMIT } from "../config/spotify";
import { DAYS_RANGE } from "../config/days-range";

interface SpotifyImage {
    url: string;
    height: number;
    width: number;
}

interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{ name: string }>;
    album: {
        name: string;
        images: SpotifyImage[];
    };
    external_urls: {
        spotify: string;
    };
}

interface SpotifyTopTracksResponse {
    items: SpotifyTrack[];
}

interface SpotifyTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

/**
 * リフレッシュトークンを使ってアクセストークンを取得
 */
async function refreshAccessToken(): Promise<string> {
    const { clientId, clientSecret, refreshToken } = spotifyConfig;

    if (!clientId || !clientSecret || !refreshToken) {
        throw new Error("Spotify credentials are not configured");
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
        "base64"
    );

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", refreshToken);

    try {
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Authorization: `Basic ${basicAuth}`,
            },
            body: params.toString(),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to refresh access token: ${response.status} - ${errorText}`
            );
        }

        const data = (await response.json()) as SpotifyTokenResponse;
        return data.access_token;
    } catch (error) {
        console.error("Error refreshing Spotify access token:", error);
        throw error;
    }
}

/**
 * 最近聴いた曲TOP5を取得してMarkdown形式で返す
 */
export async function getTopTracks(): Promise<string> {
    try {
        // アクセストークンを取得
        const accessToken = await refreshAccessToken();

        // TOP曲を取得（約4週間の期間）
        const url = new URL("https://api.spotify.com/v1/me/top/tracks");
        url.searchParams.append("time_range", "short_term");
        url.searchParams.append("limit", SPOTIFY_TOP_TRACKS_LIMIT.toString());

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Failed to fetch top tracks: ${response.status} - ${errorText}`
            );
        }

        const data = (await response.json()) as SpotifyTopTracksResponse;

        // Markdown形式に整形
        if (!data.items || data.items.length === 0) {
            return `🎵 Recently played (Last ${DAYS_RANGE} Days):\n\n_No tracks found_`;
        }

        // ヘッダー
        let markdown = `## 🎵 Recently played (Last ${DAYS_RANGE} Days)\n\n`;

        // HTMLテーブルでSpotify Embedを使った楽曲カードを生成
        markdown += '<table>\n';

        data.items.forEach((track, index) => {
            const trackId = track.id;
            const trackName = track.name;
            const artistName = track.artists.map(a => a.name).join(", ");
            const albumName = track.album.name;
            const albumArt = track.album.images[0]?.url || "";
            const spotifyUrl = track.external_urls.spotify;

            // 2列レイアウト（トップは1列、残り4曲は2列x2行）
            if (index === 0) {
                // 1位は大きく表示
                markdown += '  <tr>\n';
                markdown += '    <td align="center" colspan="2">\n';
                markdown += `      <h3>🏆 #1 Most Played</h3>\n`;
                markdown += `      <a href="${spotifyUrl}" target="_blank">\n`;
                markdown += `        <img src="${albumArt}" alt="${trackName}" width="200" />\n`;
                markdown += `      </a>\n`;
                markdown += `      <br />\n`;
                markdown += `      <strong>${trackName}</strong>\n`;
                markdown += `      <br />\n`;
                markdown += `      ${artistName}\n`;
                markdown += `      <br />\n`;
                markdown += `      <sub>${albumName}</sub>\n`;
                markdown += '    </td>\n';
                markdown += '  </tr>\n';
            } else if (index % 2 === 1) {
                // 2位以降は2列レイアウト（奇数インデックスで新しい行を開始）
                markdown += '  <tr>\n';
                markdown += '    <td align="center" width="50%">\n';
                markdown += `      <strong>#${index + 1}</strong>\n`;
                markdown += `      <br />\n`;
                markdown += `      <a href="${spotifyUrl}" target="_blank">\n`;
                markdown += `        <img src="${albumArt}" alt="${trackName}" width="150" />\n`;
                markdown += `      </a>\n`;
                markdown += `      <br />\n`;
                markdown += `      <strong>${trackName}</strong>\n`;
                markdown += `      <br />\n`;
                markdown += `      ${artistName}\n`;
                markdown += '    </td>\n';
            } else {
                // 偶数インデックスで行を閉じる
                markdown += '    <td align="center" width="50%">\n';
                markdown += `      <strong>#${index + 1}</strong>\n`;
                markdown += `      <br />\n`;
                markdown += `      <a href="${spotifyUrl}" target="_blank">\n`;
                markdown += `        <img src="${albumArt}" alt="${trackName}" width="150" />\n`;
                markdown += `      </a>\n`;
                markdown += `      <br />\n`;
                markdown += `      <strong>${trackName}</strong>\n`;
                markdown += `      <br />\n`;
                markdown += `      ${artistName}\n`;
                markdown += '    </td>\n';
                markdown += '  </tr>\n';
            }
        });

        markdown += '</table>\n';

        return markdown.trim();
    } catch (error) {
        console.error("Error fetching Spotify top tracks:", error);

        // エラーメッセージを返す
        if (error instanceof Error) {
            if (error.message.includes("credentials are not configured")) {
                return `🎵 Recently played (Last ${DAYS_RANGE} Days):\n\n_Spotify credentials not configured_`;
            }
            if (error.message.includes("401")) {
                return `🎵 Recently played (Last ${DAYS_RANGE} Days):\n\n_Authentication error: Please check Spotify credentials_`;
            }
            if (error.message.includes("429")) {
                return `🎵 Recently played (Last ${DAYS_RANGE} Days):\n\n_API rate limit exceeded. Please try again later._`;
            }
        }

        return `🎵 Recently played (Last ${DAYS_RANGE} Days):\n\n_Error fetching tracks. Please try again later._`;
    }
}
