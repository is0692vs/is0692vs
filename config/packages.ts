// config/packages.ts
export interface NpmPackageConfig {
    name: string;
    relatedUrl?: string;
}

export const npmPackages: NpmPackageConfig[] = [
    {
        name: "pr-cannon",
        relatedUrl: "https://github.com/is0692vs/pr-cannon",
    },
];
