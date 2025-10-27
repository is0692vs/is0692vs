// config/extensions.ts
// VSCode拡張機能の監視リスト
export interface VscodeExtensionConfig {
    id: string; // publisher.extension-name 形式
    repositoryUrl?: string;
}

export const vscodeExtensions: VscodeExtensionConfig[] = [
    {
        id: "hirokimukai.jules-extension",
        repositoryUrl: "https://github.com/is0692vs/jules-extension",
    },
    {
        id: "hirokimukai.code-mantra",
        repositoryUrl: "https://github.com/is0692vs/code-mantra",
    },
];
