// config/packages.ts
export interface NpmPackageConfig {
  name: string;
  repositoryUrl?: string;
}

export const npmPackages: NpmPackageConfig[] = [
  {
    name: "pr-cannon",
    repositoryUrl: "https://github.com/is0692vs/pr-cannon",
  },
];
