import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { npmStats } from "./modules/npm-stats";
import { generateChartUrl } from "./modules/chart";
import { activeProjects } from "./modules/active-projects";
import { vscodeStats } from "./modules/vscode-stats";
import { generateVscodeChartUrl } from "./modules/vscode-chart";
import { commitReflection } from "./modules/commit-reflection";
import { getTopTracks } from "./modules/spotify-top-tracks";

interface StatsHistory {
  date: string;
  packages: Record<string, number>;
}

interface VscodeStatsHistory {
  date: string;
  extensions: Record<string, number>;
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
    const statsContent = `${text}\n\n![Download Stats](${chartUrl})`;

    // コミット振り返りの処理
    console.log("🤖 Generating commit reflection...");
    const reflectionContent = await commitReflection();

    // アクティブプロジェクトの処理（新規）
    console.log("🔨 Fetching active projects...");
    const activeProjectsContent = await activeProjects(reflectionContent.text);

    // Spotify TOP曲の処理
    console.log("🎵 Fetching Spotify top tracks...");
    const spotifyContent = await getTopTracks();

    // VSCode統計の処理
    console.log("🚀 Fetching VSCode extension statistics...");
    const { text: vscodeStatsText, data: vscodeData } = await vscodeStats();

    // VSCode統計履歴を読み込み
    const vscodeHistoryPath = "data/vscode-stats-history.json";
    let vscodeHistory: VscodeStatsHistory[] = [];

    if (existsSync(vscodeHistoryPath)) {
      vscodeHistory = JSON.parse(readFileSync(vscodeHistoryPath, "utf-8"));
    }

    // 今日のVSCode統計を追加
    const todayVscodeStats: VscodeStatsHistory = {
      date: today,
      extensions: Object.fromEntries(
        vscodeData.map((d) => [d.extension, d.installs])
      ),
    };

    // 同じ日付のデータがあれば更新、なければ追加
    const vscodeExistingIndex = vscodeHistory.findIndex(
      (h) => h.date === today
    );
    if (vscodeExistingIndex >= 0) {
      vscodeHistory[vscodeExistingIndex] = todayVscodeStats;
    } else {
      vscodeHistory.push(todayVscodeStats);
    }

    // 最新30日分のみ保持
    vscodeHistory = vscodeHistory.slice(-30);

    // 履歴を保存
    writeFileSync(vscodeHistoryPath, JSON.stringify(vscodeHistory, null, 2));

    // グラフURL生成
    const vscodeChartUrl = generateVscodeChartUrl(vscodeHistory);
    const vscodeContent =
      vscodeData.length > 0
        ? `${vscodeStatsText}\n\n![VSCode Extension Stats](${vscodeChartUrl})`
        : vscodeStatsText;

    // READMEを更新
    console.log("📄 Reading README.md...");
    let readme = readFileSync("README.md", "utf-8");

    console.log("✏️ Updating README.md...");

    // stats部分を更新
    readme = readme.replace(
      /<!-- stats:start -->[\s\S]*<!-- stats:end -->/,
      `<!-- stats:start -->\n${statsContent}\n<!-- stats:end -->`
    );

    // vscode-stats部分を更新
    readme = readme.replace(
      /<!-- vscode-stats:start -->[\s\S]*<!-- vscode-stats:end -->/,
      `<!-- vscode-stats:start -->\n${vscodeContent}\n<!-- vscode-stats:end -->`
    );

    // active-projects部分を更新（reflectionを含む）
    readme = readme.replace(
      /<!-- active-projects:start -->[\s\S]*<!-- active-projects:end -->/,
      `<!-- active-projects:start -->\n${activeProjectsContent}\n<!-- active-projects:end -->`
    );

    // spotify部分を更新
    readme = readme.replace(
      /<!-- spotify:start -->[\s\S]*<!-- spotify:end -->/,
      `<!-- spotify:start -->\n${spotifyContent}\n<!-- spotify:end -->`
    );

    writeFileSync("README.md", readme);
    console.log("✅ README.md updated successfully!");
    console.log("\nUpdated stats:");
    console.log(statsContent);
    console.log("\nUpdated VSCode stats:");
    console.log(vscodeContent);
    console.log("\nUpdated commit reflection:");
    console.log(reflectionContent.text);
    console.log("\nUpdated Spotify top tracks:");
    console.log(spotifyContent);
    console.log("\nUpdated active projects:");
    console.log(activeProjectsContent);
  } catch (error) {
    console.error("❌ Error updating README:", error);
    process.exit(1);
  }
}

main();
