// scripts/spotify-auth.ts
const CLIENT_ID = ''; // Spotify DashboardのClient ID
const CLIENT_SECRET = ''; // Spotify DashboardのClient Secret
const REDIRECT_URI = 'http://127.0.0.1:8888/callback'; // Spotify Dashboardで設定したRedirect URI
// Step 1: ブラウザで開く認証URL
const scopes = 'user-top-read user-read-recently-played';
const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${CLIENT_ID}` +
    `&response_type=code` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=${encodeURIComponent(scopes)}`;

console.log('以下のURLをブラウザで開いてください：\n');
console.log(authUrl);
console.log('\n認証後，リダイレクトされたURLから「code=」の後の文字列をコピーしてください');

// Step 2: codeを入力してトークンを取得
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\ncodeを貼り付けてください: ', async (code: string) => {
    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code: code.trim(),
                redirect_uri: REDIRECT_URI
            })
        });

        const data = await response.json();

        if (data.refresh_token) {
            console.log('\n✅ 成功！以下をGitHub Secretsに保存してください：\n');
            console.log('SPOTIFY_CLIENT_ID:', CLIENT_ID);
            console.log('SPOTIFY_CLIENT_SECRET:', CLIENT_SECRET);
            console.log('SPOTIFY_REFRESH_TOKEN:', data.refresh_token);
        } else {
            console.error('エラー:', data);
        }
    } catch (error) {
        console.error('エラー:', error);
    }
    rl.close();
});