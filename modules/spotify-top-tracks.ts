import { spotifyConfig } from "../config/spotify";

interface SpotifyTrack {
    name: string;
    artists: Array<{ name: string }>;
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

        // TOP5の曲を取得（約4週間の期間）
        const url = new URL("https://api.spotify.com/v1/me/top/tracks");
        url.searchParams.append("time_range", "short_term");
        url.searchParams.append("limit", "5");

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
            return "🎵 Recently played (Last 4 weeks):\n\n_No tracks found_";
        }

        let markdown = "🎵 Recently played (Last 4 weeks):\n";

        data.items.forEach((track, index) => {
            const trackName = track.name;
            const artistName = track.artists[0]?.name || "Unknown Artist";
            const spotifyUrl = track.external_urls.spotify;

            markdown += `${index + 1}. 🎧 [${trackName} - ${artistName}](${spotifyUrl})\n`;
        });

        return markdown.trim();
    } catch (error) {
        console.error("Error fetching Spotify top tracks:", error);

        // エラーメッセージを返す
        if (error instanceof Error) {
            if (error.message.includes("credentials are not configured")) {
                return "🎵 Recently played (Last 4 weeks):\n\n_Spotify credentials not configured_";
            }
            if (error.message.includes("401")) {
                return "🎵 Recently played (Last 4 weeks):\n\n_Authentication error: Please check Spotify credentials_";
            }
            if (error.message.includes("429")) {
                return "🎵 Recently played (Last 4 weeks):\n\n_API rate limit exceeded. Please try again later._";
            }
        }

        return "🎵 Recently played (Last 4 weeks):\n\n_Error fetching tracks. Please try again later._";
    }
}
