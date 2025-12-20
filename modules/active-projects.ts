import { githubUsername } from "../config/github";
import { COMMIT_DAYS_RANGE } from "../config/days-range";
import { geminiModel } from "../config/gemini";

interface Repository {
  name: string;
  owner: { login: string };
  pushed_at: string;
  html_url: string;
  language: string | null;
  stargazers_count: number;
}

interface ProjectStats {
  name: string;
  owner: string;
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
  try {
    const url = `https://api.github.com/user/repos?sort=pushed&per_page=100&affiliation=owner,collaborator,organization_member`;

    if (!GH_PAT) {
      throw new Error("GH_PAT is not set");
    }

    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) {
      throw new Error(`Failed to fetch repositories (Authenticated)`);
    }

    return await response.json();
  } catch (error) {
    console.warn("⚠️ Authenticated fetch failed, falling back to public repositories:", error);
    const url = `https://api.github.com/users/${githubUsername}/repos?sort=pushed&per_page=100`;
    // フォールバック時はheadersにAuthorizationを含めるかはgetHeaders()依存（GH_PATがあれば使う）
    // ただしGH_PATが無効で401だった場合は外すべきかもしれないが、
    // getHeaders()はGH_PATがあれば使う実装。
    // ここでは単純に同じgetHeadersを使う（public endpointなら401でも通る？いや401 tokenは弾かれる）
    // 安全のため、GH_PAT依存しないヘッダーを作るか、あるいはエラーが401ならトークンなしでリトライすべき。
    // ここでは簡易的に、getHeaders()を使う。もしトークンが無効ならこれも死ぬが、
    // GITHUB_TOKEN (Actions) の場合、user/reposは403 forbiddenだが users/xxx/reposは200 OKになるはず。

    const response = await fetch(url, { headers: getHeaders() });

    if (!response.ok) {
      throw new Error(`Failed to fetch repositories (Fallback)`);
    }

    // 戻り値の型合わせ（ownerがない場合などはAPI仕様次第だが、public endpointもownerを返す）
    const repos = await response.json();
    // ownerオブジェクトがない場合に備えて補完（通常はある）
    return repos.map((r: any) => ({
      ...r,
      owner: r.owner || { login: githubUsername }
    }));
  }
}

async function getCommitCount(
  owner: string,
  repoName: string,
  since: string
): Promise<number> {
  try {
    let totalCommits = 0;
    let page = 1;
    const perPage = 100;

    while (true) {
      const url = `https://api.github.com/repos/${owner}/${repoName}/commits?since=${since}&author=${githubUsername}&per_page=${perPage}&page=${page}`;
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
  nDaysAgo.setDate(nDaysAgo.getDate() - COMMIT_DAYS_RANGE);
  return lastPush >= nDaysAgo;
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

function getModelDisplayName(model: string): string {
  // gemini-2.5-flash -> gemini25flash
  // gemini-2.0-pro-exp-02-05 -> gemini20proexp0205
  return model.replace(/-/g, "");
}

export async function activeProjects(reflectionText?: string): Promise<string> {
  try {
    const repos = await fetchUserRepos();

    const nDaysAgo = new Date();
    nDaysAgo.setDate(nDaysAgo.getDate() - COMMIT_DAYS_RANGE);
    const since = nDaysAgo.toISOString();

    const activeRepos = repos
      .filter((repo) => isActiveInLastDays(repo.pushed_at))
      .filter((repo) => repo.name !== githubUsername)
      .slice(0, 10);

    if (activeRepos.length === 0) {
      return `## 🔨 Active Projects (Last ${COMMIT_DAYS_RANGE} Days)\n\n_No active projects in the last ${COMMIT_DAYS_RANGE} days_`;
    }

    // 各リポジトリのコミット数を並行取得
    const projectStats: ProjectStats[] = await Promise.all(
      activeRepos.map(async (repo) => {
        const commits = await getCommitCount(repo.owner.login, repo.name, since);
        return {
          name: repo.name,
          owner: repo.owner.login,
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

    // ヘッダー
    let markdown = `## 🔨 Active Projects (Last ${COMMIT_DAYS_RANGE} Days)\n\n`;

    // Geminiのサマリーを追加
    if (reflectionText) {
      const modelName = getModelDisplayName(geminiModel);
      markdown += `### 🤖 ${modelName}による直近${COMMIT_DAYS_RANGE}日の活動サマリー\n\n`;
      markdown += `${reflectionText}\n\n`;
    }

    markdown += `_Total: ${totalCommits} commits across ${projectStats.length} projects_\n\n`;

    // カードレイアウト（Spotifyスタイル）
    markdown += '<table>\n';
    markdown += '  <tr>\n';

    // 上位3つのプロジェクトのみ表示
    const topProjects = projectStats.slice(0, 3);

    for (const project of topProjects) {
      const langEmoji = getLanguageEmoji(project.language);
      const percentage =
        totalCommits > 0
          ? ((project.commits / totalCommits) * 100).toFixed(1)
          : "0.0";

      // コミット数を視覚化（プログレスバー風）
      const commitPercent = Math.min((project.commits / 50) * 100, 100); // 50コミットで100%

      markdown += '    <td align="center" width="33%">\n';
      markdown += `      <a href="${project.url}" target="_blank">\n`;
      markdown += `        <img src="https://opengraph.githubassets.com/1/${project.url.replace('https://github.com/', '')}" alt="${project.name}" width="100%" />\n`;
      markdown += `      </a>\n`;
      markdown += `      <br />\n`;
      markdown += `      <sub><strong><a href="${project.url}" target="_blank">${project.name}</a></strong></sub>\n`;
      markdown += `      <br />\n`;
      markdown += `      <sub>📊 ${project.commits} commits (${percentage}%)</sub>\n`;
      markdown += `      <br />\n`;
      markdown += `      <sub>${langEmoji} ${project.language} ${project.stars > 0 ? `⭐ ${project.stars}` : ''}</sub>\n`;
      markdown += '    </td>\n';
    }

    markdown += '  </tr>\n';
    markdown += '</table>\n';

    return markdown;
  } catch (error) {
    console.error("Error fetching active projects:", error);
    return "## 🔨 Active Projects\n\n_Error fetching projects. Please try again later._";
  }
}
