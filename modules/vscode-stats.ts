import { vscodeExtensions } from "../config/extensions";

interface ExtensionStats {
  id: string;
  name: string;
  installs: number;
  rating: string;
  version: string;
}

interface ExtensionData {
  extension: string;
  installs: number;
}

async function fetchExtensionStats(
  extensionId: string
): Promise<ExtensionStats> {
  const url =
    "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery";

  const body = {
    filters: [
      {
        criteria: [
          {
            filterType: 7,
            value: extensionId,
          },
        ],
      },
    ],
    flags: 914,
    assetTypes: ["Microsoft.VisualStudio.Code.WebResources|Markdown"],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json;api-version=3.0-preview.1",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch stats for ${extensionId}`);
  }

  const data = await response.json();

  if (
    !data.results ||
    !data.results[0] ||
    !data.results[0].extensions ||
    data.results[0].extensions.length === 0
  ) {
    throw new Error(`Extension not found: ${extensionId}`);
  }

  const extension = data.results[0].extensions[0];

  // Extract stats - use statisticName instead of statisticId
  const stats = extension.statistics || [];
  const installs =
    stats.find((s: { statisticName: string }) => s.statisticName === "install")
      ?.value || 0;
  const ratingCount =
    stats.find(
      (s: { statisticName: string }) => s.statisticName === "ratingcount"
    )?.value || 0;
  const weightedRating =
    stats.find(
      (s: { statisticName: string }) => s.statisticName === "weightedRating"
    )?.value || 0;

  // 評価テキストの生成
  const ratingText =
    ratingCount > 0
      ? `⭐ ${parseFloat(weightedRating).toFixed(1)}/5 (${ratingCount} ratings)`
      : "⭐ No ratings yet";

  return {
    id: extensionId,
    name: extension.displayName || extension.extensionName,
    installs,
    rating: ratingText,
    version: extension.versions[0]?.version || "0.0.0",
  };
}

export async function vscodeStats(): Promise<{
  text: string;
  data: ExtensionData[];
}> {
  // 拡張機能リストが空の場合
  if (vscodeExtensions.length === 0) {
    return {
      text: "🚀 VSCode Extensions:\n_No extensions configured_",
      data: [],
    };
  }

  const stats = await Promise.all(
    vscodeExtensions.map((ext) => fetchExtensionStats(ext))
  );

  const text =
    "🚀 VSCode Extensions:\n" +
    stats
      .map(
        (s) =>
          `- **${s.name}**: ${s.installs.toLocaleString()} installs | ${
            s.rating
          } | v${s.version}`
      )
      .join("\n");

  const data = stats.map((s) => ({
    extension: s.name,
    installs: s.installs,
  }));

  return { text, data };
}
