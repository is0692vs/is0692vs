import "dotenv/config";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { npmStats } from "./modules/npm-stats";
import { generateChartUrl } from "./modules/chart";
import { activeProjects } from "./modules/active-projects";
import { vscodeStats } from "./modules/vscode-stats";
import { generateVscodeChartUrl } from "./modules/vscode-chart";
import { commitReflection } from "./modules/commit-reflection";
import { getTopTracks } from "./modules/spotify-top-tracks";
import { weatherGreeting } from "./modules/weather-greeting";
import { DAYS_RANGE } from "./config/days-range";

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
    console.log("🌍 Fetching weather greeting...");
    const weatherGreetingContent = await weatherGreeting();

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

    // 履歴を保存（全期間）
    writeFileSync(historyPath, JSON.stringify(history, null, 2));

    // グラフ生成用に最新`DAYS_RANGE`日分のデータをスライス
    const slicedHistory = history.slice(-DAYS_RANGE);

    // グラフURL生成
    const chartUrl = generateChartUrl(slicedHistory);
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

    // VSCode統計履歴を読み込み
    const vscodeHistoryPath = "data/vscode-stats-history.json";
    let vscodeHistory: VscodeStatsHistory[] = [];

    if (existsSync(vscodeHistoryPath)) {
      vscodeHistory = JSON.parse(readFileSync(vscodeHistoryPath, "utf-8"));
    }
    // VSCode統計の処理
    console.log("🚀 Fetching VSCode extension statistics...");
    const { text: vscodeStatsText, data: vscodeData } = await vscodeStats(
      vscodeHistory
    );

    // 今日の日付のインデックスを探す
    const vscodeExistingIndex = vscodeHistory.findIndex((h) => h.date === today);
    let todayVscodeStats: VscodeStatsHistory;

    if (vscodeExistingIndex >= 0) {
      // 今日のデータが既にある場合
      todayVscodeStats = vscodeHistory[vscodeExistingIndex];
    } else {
      // 今日のデータがまだない場合
      const previousDayStats =
        vscodeHistory.length > 0
          ? vscodeHistory[vscodeHistory.length - 1]
          : null;
      todayVscodeStats = {
        date: today,
        // 前日のデータを引き継ぐ or 新規作成
        extensions: previousDayStats ? { ...previousDayStats.extensions } : {},
      };
    }

    // APIから取得したデータで更新
    for (const d of vscodeData) {
      const extensionName = d.extension;
      const newInstalls = d.installs;
      const currentInstalls = todayVscodeStats.extensions[extensionName] || 0;

      // 新しい値と現在の値のうち、大きい方を採用
      todayVscodeStats.extensions[extensionName] = Math.max(
        newInstalls,
        currentInstalls
      );
    }

    // 履歴を更新
    if (vscodeExistingIndex >= 0) {
      vscodeHistory[vscodeExistingIndex] = todayVscodeStats;
    } else {
      vscodeHistory.push(todayVscodeStats);
    }

    // 履歴を保存（全期間）
    writeFileSync(vscodeHistoryPath, JSON.stringify(vscodeHistory, null, 2));

    // グラフ生成用に最新`DAYS_RANGE`日分のデータをスライス
    const slicedVscodeHistory = vscodeHistory.slice(-DAYS_RANGE);

    // グラフURL生成
    const vscodeChartUrl = generateVscodeChartUrl(slicedVscodeHistory);
    const vscodeContent =
      vscodeData.length > 0
        ? `${vscodeStatsText}\n\n![VSCode Extension Stats](${vscodeChartUrl})`
        : vscodeStatsText;

    // READMEを更新
    console.log("📄 Reading README.md...");
    let readme = readFileSync("README.md", "utf-8");

    console.log("✏️ Updating README.md...");

    // weather-greeting部分を更新（最上部）
    readme = readme.replace(
      /<!-- weather-greeting:start -->[\s\S]*<!-- weather-greeting:end -->/,
      `<!-- weather-greeting:start -->\n${weatherGreetingContent}\n<!-- weather-greeting:end -->`
    );

    // vscode-stats部分を更新
    readme = readme.replace(
      /<!-- vscode-stats:start -->[\s\S]*<!-- vscode-stats:end -->/,
      `<!-- vscode-stats:start -->\n${vscodeContent}\n<!-- vscode-stats:end -->`
    );

    // stats部分を更新
    readme = readme.replace(
      /<!-- stats:start -->[\s\S]*<!-- stats:end -->/,
      `<!-- stats:start -->\n${statsContent}\n<!-- stats:end -->`
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
    console.log("\nUpdated weather greeting:");
    console.log(weatherGreetingContent);
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
