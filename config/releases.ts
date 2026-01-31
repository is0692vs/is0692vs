// config/releases.ts
export interface ReleaseConfig {
    owner: string;
    repo: string;
    displayName?: string;
}

// リリース情報を取得するリポジトリ一覧
export const releaseRepos: ReleaseConfig[] = [
    {
        owner: "is0692vs",
        repo: "pr-cannon",
        displayName: "PR Cannon",
    },
    {
        owner: "is0692vs",
        repo: "jules-extension",
        displayName: "Jules Extension",
    },
    {
        owner: "is0692vs",
        repo: "code-mantra",
        displayName: "Code Mantra",
    },
    {
        owner: "is0692vs",
        repo: "link-canvas",
        displayName: "Link Canvas",
    },
];

// 表示するリリースの最大数
export const MAX_RELEASES_DISPLAY = 5;

// リリースノートの最大文字数（長すぎる場合は切り詰め）
export const MAX_RELEASE_NOTE_LENGTH = 300;