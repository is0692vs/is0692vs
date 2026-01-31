// config/releases.ts
export interface ReleaseConfig {
    url: string;
    displayName: string;
}

// リリース情報を取得するリポジトリ一覧
// URLは "https://github.com/owner/repo" の形式
export const releaseRepos: ReleaseConfig[] = [
    // {
    //     url: "https://github.com/is0692vs/pr-cannon",
    //     displayName: "PR Cannon",
    // },
    {
        url: "https://github.com/Hiroki-org/jules-extension",
        displayName: "Jules Extension",
    },
    // {
    //     url: "https://github.com/is0692vs/code-mantra",
    //     displayName: "Code Mantra",
    // },
    // {
    //     url: "https://github.com/is0692vs/link-canvas",
    //     displayName: "Link Canvas",
    // },
];

// 表示するリリースの最大数
export const MAX_RELEASES_DISPLAY = 5;

// リリースノートの最大文字数（長すぎる場合は切り詰め）
export const MAX_RELEASE_NOTE_LENGTH = 300;