import { npmPackages } from "../config/packages";

interface NpmStats {
  package: string;
  downloads: number;
}

async function fetchNpmStats(packageName: string): Promise<NpmStats> {
  const url = `https://api.npmjs.org/downloads/point/last-week/${packageName}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch stats for ${packageName}`);
  }

  const data = await response.json();

  return {
    package: packageName,
    downloads: data.downloads,
  };
}

export async function npmStats(): Promise<{ text: string; data: NpmStats[] }> {
  const stats = await Promise.all(npmPackages.map((pkg) => fetchNpmStats(pkg)));

  const text = stats
    .map(
      (s) => `📦 ${s.package}: ${s.downloads.toLocaleString()} downloads/week`
    )
    .join("\n");

  return { text, data: stats };
}
