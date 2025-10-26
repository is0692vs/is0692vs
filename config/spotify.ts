/**
 * Spotify TOP曲の表示設定
 */
export const SPOTIFY_TOP_TRACKS_LIMIT = 3;

export const spotifyConfig = {
    clientId: process.env.SPOTIFY_CLIENT_ID || process.env.YOUR_CLIENT_ID || '',
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || process.env.YOUR_CLIENT_SECRET || '',
    refreshToken: process.env.SPOTIFY_REFRESH_TOKEN || '',
};
