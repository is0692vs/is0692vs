import { npmPackages, type NpmPackageConfig } from "../config/packages";

interface NpmStats {
  package: string;
  downloads: number;
  relatedUrl?: string;
}

async function getPackageCreatedDate(packageName: string): Promise<string> {
  const url = `https://registry.npmjs.org/${packageName}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch package info for ${packageName}`);
  }

  const data = await response.json();
  return data.time.created.split('T')[0]; // YYYY-MM-DD
}

async function getTotalDownloads(packageName: string, createdDate: string): Promise<number> {
  const now = new Date().toISOString().split('T')[0];
  const url = `https://api.npmjs.org/downloads/range/${createdDate}:${now}/${packageName}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch download stats for ${packageName}`);
  }

  const data = await response.json();
  const total = data.downloads.reduce((sum: number, day: any) => sum + day.downloads, 0);
  return total;
}

async function fetchNpmStats(config: NpmPackageConfig): Promise<NpmStats> {
  const createdDate = await getPackageCreatedDate(config.name);
  const totalDownloads = await getTotalDownloads(config.name, createdDate);

  return {
    package: config.name,
    downloads: totalDownloads,
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
      return `📦 **${packageName}**: ${s.downloads.toLocaleString()} total downloads`;
    })
    .join("\n");

  return { text, data: stats };
}
