import { readFileSync, writeFileSync, existsSync } from "fs";
import { npmStats } from "./modules/npm-stats";
import { generateChartUrl } from "./modules/chart";

interface StatsHistory {
  date: string;
  packages: Record<string, number>;
}

async function main() {
  try {
    console.log("📊 Fetching npm statistics...");
    const { text, data } = await npmStats();

    // 統計履歴を読み込み
    const historyPath = "data/stats-history.json";
    let history: StatsHistory[] = [];

    if (existsSync(historyPath)) {
      history = JSON.parse(readFileSync(historyPath, "utf-8"));
    }

    // 今日の統計を追加
    const today = new Date().toISOString().split("T")[0];
    const todayStats: StatsHistory = {
      date: today,
      packages: Object.fromEntries(data.map((d) => [d.package, d.downloads])),
    };

    // 同じ日付のデータがあれば更新、なければ追加
    const existingIndex = history.findIndex((h) => h.date === today);
    if (existingIndex >= 0) {
      history[existingIndex] = todayStats;
    } else {
      history.push(todayStats);
    }

    // 最新30日分のみ保持
    history = history.slice(-30);

    // 履歴を保存
    writeFileSync(historyPath, JSON.stringify(history, null, 2));

    // グラフURL生成
    const chartUrl = generateChartUrl(history);

    // READMEを更新
    console.log("📄 Reading README.md...");
    const readme = readFileSync("README.md", "utf-8");

    console.log("✏️ Updating README.md...");
    const content = `${text}\n\n![Download Stats](${chartUrl})`;
    const updated = readme.replace(
      /<!-- stats:start -->[\s\S]*<!-- stats:end -->/,
      `<!-- stats:start -->\n${content}\n<!-- stats:end -->`
    );

    writeFileSync("README.md", updated);
    console.log("✅ README.md updated successfully!");
    console.log("\nUpdated content:");
    console.log(content);
  } catch (error) {
    console.error("❌ Error updating README:", error);
    process.exit(1);
  }
}

main();
