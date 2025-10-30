// config/extensions.ts
// VSCode拡張機能の監視リスト
export interface VscodeExtensionConfig {
    id: string; // publisher.extension-name 形式
    relatedUrl?: string;
}

export const vscodeExtensions: VscodeExtensionConfig[] = [
    {
        id: "hirokimukai.jules-extension",
        relatedUrl: "https://github.com/is0692vs/jules-extension",
    },
    {
        id: "hirokimukai.code-mantra",
        relatedUrl: "https://github.com/is0692vs/code-mantra",
    },
    {
        id: "hirokimukai.link-canvas",
        relatedUrl: "https://github.com/is0692vs/link-canvas",
    },

];
