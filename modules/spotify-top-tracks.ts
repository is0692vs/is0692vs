import { spotifyConfig, SPOTIFY_TOP_TRACKS_LIMIT } from "../config/spotify";
import { DAYS_RANGE } from "../config/days-range";
import { fetchWithRetry } from "./fetch-retry";

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
        const response = await fetchWithRetry("https://accounts.spotify.com/api/token", {
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

        const response = await fetchWithRetry(url.toString(), {
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
            return `🎵 My Top Tracks on Spotify (Recently):\n\n_No tracks found_`;
        }

        // ヘッダー
        let markdown = `## 🎵 My Top Tracks on Spotify (Recently)\n\n`;

        // 横並びレイアウト - 1行のテーブルで実装
        markdown += '<table>\n';
        markdown += '  <tr>\n';

        data.items.forEach((track, index) => {
            const trackName = track.name;
            const artistName = track.artists.map(a => a.name).join(", ");
            const albumArt = track.album.images[0]?.url || "";
            const spotifyUrl = track.external_urls.spotify;

            // 各曲を横並びに配置
            markdown += '    <td align="center">\n';
            markdown += `      <a href="${spotifyUrl}" target="_blank">\n`;
            markdown += `        <img src="${albumArt}" alt="${trackName}" width="120" />\n`;
            markdown += `      </a>\n`;
            markdown += `      <br />\n`;
            markdown += `      <sub><strong>#${index + 1}</strong></sub>\n`;
            markdown += `      <br />\n`;
            markdown += `      <sub>${trackName}</sub>\n`;
            markdown += `      <br />\n`;
            markdown += `      <sub>${artistName}</sub>\n`;
            markdown += '    </td>\n';
        });

        markdown += '  </tr>\n';
        markdown += '</table>\n';

        return markdown.trim();
    } catch (error) {
        console.error("Error fetching Spotify top tracks:", error);

        // エラーメッセージを返す
        if (error instanceof Error) {
            if (error.message.includes("credentials are not configured")) {
                return `🎵 My Top Tracks on Spotify (Recently):\n\n_Spotify credentials not configured_`;
            }
            if (error.message.includes("401")) {
                return `🎵 My Top Tracks on Spotify (Recently):\n\n_Authentication error: Please check Spotify credentials_`;
            }
            if (error.message.includes("429")) {
                return `🎵 My Top Tracks on Spotify (Recently):\n\n_API rate limit exceeded. Please try again later._`;
            }
        }

        return `🎵 My Top Tracks on Spotify (Recently):\n\n_Error fetching tracks. Please try again later._`;
    }
}
