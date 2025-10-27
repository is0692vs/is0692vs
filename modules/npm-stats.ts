import { npmPackages, type NpmPackageConfig } from "../config/packages";

interface NpmStats {
  package: string;
  downloads: number;
  relatedUrl?: string;
}

async function fetchNpmStats(config: NpmPackageConfig): Promise<NpmStats> {
  const url = `https://api.npmjs.org/downloads/point/last-week/${config.name}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stats for ${config.name}`);
  }

  const data = await response.json();

  return {
    package: config.name,
    downloads: data.downloads,
    relatedUrl: config.relatedUrl,
  };
}

export async function npmStats(): Promise<{ text: string; data: NpmStats[] }> {
  const stats = await Promise.all(npmPackages.map((pkg) => fetchNpmStats(pkg)));

  const text = stats
    .map((s) => {
      const packageName = s.relatedUrl
        ? `[${s.package}](${s.relatedUrl})`
        : s.package;
      return `📦 **${packageName}**: ${s.downloads.toLocaleString()} downloads/week`;
    })
    .join("\n");

  return { text, data: stats };
}
