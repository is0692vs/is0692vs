import { githubUsername } from "../config/github";
import { DAYS_RANGE } from "../config/days-range";

interface Repository {
  name: string;
  pushed_at: string;
  html_url: string;
  language: string | null;
  stargazers_count: number;
}

interface ProjectStats {
  name: string;
  url: string;
  commits: number;
  lastPush: string;
  language: string;
  stars: number;
}

const GH_PAT = process.env.GH_PAT;

function getHeaders(): HeadersInit {
  return GH_PAT
    ? {
        Authorization: `Bearer ${GH_PAT}`,
        Accept: "application/vnd.github.v3+json",
      }
    : { Accept: "application/vnd.github.v3+json" };
}

async function fetchUserRepos(): Promise<Repository[]> {
  const url = `https://api.github.com/users/${githubUsername}/repos?sort=pushed&per_page=100`;
  const response = await fetch(url, { headers: getHeaders() });

  if (!response.ok) {
    throw new Error(`Failed to fetch repositories for ${githubUsername}`);
  }

  return await response.json();
}

async function getCommitCount(
  repoName: string,
  since: string
): Promise<number> {
  try {
    let totalCommits = 0;
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = `https://api.github.com/repos/${githubUsername}/${repoName}/commits?since=${since}&per_page=${perPage}&page=${page}`;
      const response = await fetch(url, { headers: getHeaders() });
      if (!response.ok) break;

      const commits = await response.json();
      if (commits.length === 0) break;

      totalCommits += commits.length;

      // 100件未満なら最後のページ
      if (commits.length < perPage) break;
      page++;
    }

    return totalCommits;
  } catch {
    return 0;
  }
}

function isActiveInLastDays(pushedAt: string): boolean {
  const lastPush = new Date(pushedAt);
  const nDaysAgo = new Date();
  nDaysAgo.setDate(nDaysAgo.getDate() - DAYS_RANGE);
  return lastPush >= nDaysAgo;
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function getCommitBar(commits: number): string {
  const maxBar = 10;
  const filled = Math.min(Math.ceil(commits / 2), maxBar);
  const empty = maxBar - filled;
  return "🟩".repeat(filled) + "⬜".repeat(empty);
}

function generateAnimatedCircleChart(
  commits: number,
  totalCommits: number
): string {
  const percentage = totalCommits > 0 ? (commits / totalCommits) * 100 : 0;
  const circumference = 2 * Math.PI * 45; // r=45の円周
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // SVG with CSS animation
  const svg = `
<svg width="120" height="120" viewBox="0 0 120 120" style="transform: rotate(-90deg)">
  <defs>
    <style>
      @keyframes fillAnimation {
        from {
          stroke-dashoffset: ${circumference};
        }
        to {
          stroke-dashoffset: ${strokeDashoffset};
        }
      }
      .commit-circle {
        animation: fillAnimation 1.5s ease-out forwards;
      }
    </style>
  </defs>
  <!-- 背景の円 -->
  <circle cx="60" cy="60" r="45" fill="none" stroke="#e0e0e0" stroke-width="8"/>
  <!-- アニメーション付き進捗円 -->
  <circle
    class="commit-circle"
    cx="60" cy="60" r="45"
    fill="none"
    stroke="#4CAF50"
    stroke-width="8"
    stroke-dasharray="${circumference}"
    stroke-linecap="round"
  />
  <!-- テキスト -->
  <text x="60" y="58" font-size="22" font-weight="bold" text-anchor="middle" fill="#333" transform="rotate(90 60 60)">
    ${percentage.toFixed(1)}%
  </text>
  <text x="60" y="75" font-size="12" text-anchor="middle" fill="#666" transform="rotate(90 60 60)">
    ${commits}/${totalCommits}
  </text>
</svg>
  `.trim();

  return svg;
}

function getLanguageEmoji(language: string | null): string {
  const emojiMap: Record<string, string> = {
    TypeScript: "🔷",
    JavaScript: "🟨",
    Python: "🐍",
    Java: "☕",
    Go: "🐹",
    Rust: "🦀",
    Ruby: "💎",
    PHP: "🐘",
    Swift: "🦅",
    Kotlin: "🟣",
    C: "🔵",
    "C++": "🔴",
    "C#": "🟢",
    HTML: "🌐",
    CSS: "🎨",
    Vue: "💚",
    React: "⚛️",
  };
  return emojiMap[language || ""] || "📄";
}

export async function activeProjects(): Promise<string> {
  try {
    const repos = await fetchUserRepos();

    const nDaysAgo = new Date();
    nDaysAgo.setDate(nDaysAgo.getDate() - DAYS_RANGE);
    const since = nDaysAgo.toISOString();

    const activeRepos = repos
      .filter((repo) => isActiveInLastDays(repo.pushed_at))
      .filter((repo) => repo.name !== githubUsername)
      .slice(0, 10);

    if (activeRepos.length === 0) {
      return `## 🔨 Active Projects (Last ${DAYS_RANGE} Days)\n\n_No active projects in the last ${DAYS_RANGE} days_`;
    }

    // 各リポジトリのコミット数を並行取得
    const projectStats: ProjectStats[] = await Promise.all(
      activeRepos.map(async (repo) => {
        const commits = await getCommitCount(repo.name, since);
        return {
          name: repo.name,
          url: repo.html_url,
          commits,
          lastPush: repo.pushed_at,
          language: repo.language || "Unknown",
          stars: repo.stargazers_count,
        };
      })
    );

    // コミット数でソート（降順）
    projectStats.sort((a, b) => b.commits - a.commits);

    // 全体のコミット数を計算
    const totalCommits = projectStats.reduce((sum, p) => sum + p.commits, 0);

    // テーブルヘッダー
    let table = `## 🔨 Active Projects (Last ${DAYS_RANGE} Days)\n\n`;
    table += `_Total: ${totalCommits} commits across ${projectStats.length} projects_\n\n`;
    table +=
      "| 🚀 Project | 📊 Commits | ⏱️ Last Push | 💻 Language | ⭐ Stars |\n";
    table +=
      "|:-----------|:-----------|:-------------|:------------|:--------:|\n";

    // テーブル行
    for (const project of projectStats) {
      const relativeTime = getRelativeTime(project.lastPush);
      const langEmoji = getLanguageEmoji(project.language);
      const percentage =
        totalCommits > 0
          ? ((project.commits / totalCommits) * 100).toFixed(1)
          : "0.0";

      table += `| **[${project.name}](${project.url})** | **${project.commits}** (${percentage}%) | ${relativeTime} | ${langEmoji} ${project.language} | ${project.stars} |\n`;
    }

    return table;
  } catch (error) {
    console.error("Error fetching active projects:", error);
    return "## 🔨 Active Projects\n\n_Error fetching projects. Please try again later._";
  }
}
