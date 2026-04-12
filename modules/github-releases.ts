import { releaseRepos, MAX_RELEASES_DISPLAY, MAX_RELEASE_NOTE_LENGTH, type ReleaseConfig } from "../config/releases";
import { githubUsername } from "../config/github";
import { fetchWithRetry } from "./fetch-retry";

interface Release {
    tagName: string;
    name: string;
    body: string;
    publishedAt: string;
    url: string;
    prerelease: boolean;
    draft: boolean;
}

interface RepoRelease {
    repo: string;
    displayName: string;
    owner: string;
    releases: Release[];
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

// URLからownerとrepoを抽出する関数
function parseRepoUrl(url: string): { owner: string; repo: string } | null {
    const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
        return { owner: match[1], repo: match[2] };
    }
    return null;
}

async function fetchReleasesForRepo(config: ReleaseConfig): Promise<RepoRelease> {
    const parsed = parseRepoUrl(config.url);
    if (!parsed) {
        console.warn(`⚠️ Invalid repository URL: ${config.url}`);
        return {
            repo: config.url,
            displayName: config.displayName,
            owner: "",
            releases: [],
        };
    }

    const { owner, repo } = parsed;

    try {
        const url = `https://api.github.com/repos/${owner}/${repo}/releases?per_page=30`;
        const response = await fetchWithRetry(url, { headers: getHeaders() });

        if (!response.ok) {
            console.warn(`⚠️ Failed to fetch releases for ${owner}/${repo}: ${response.status}`);
            return {
                repo,
                displayName: config.displayName,
                owner,
                releases: [],
            };
        }

        const responseText = await response.text();
        console.log(`📦 Response size: ${responseText.length} bytes for ${owner}/${repo}`);

        let data: any[];
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.warn(`⚠️ Failed to parse JSON for ${owner}/${repo}:`, e);
            return {
                repo,
                displayName: config.displayName,
                owner,
                releases: [],
            };
        }

        if (!Array.isArray(data)) {
            console.warn(`⚠️ Unexpected response format for ${owner}/${repo}:`, typeof data);
            return {
                repo,
                displayName: config.displayName,
                owner,
                releases: [],
            };
        }

        console.log(`📦 Found ${data.length} releases for ${owner}/${repo}`);

        // ドラフトを除外（prereleaseは含める）
        // 注意: 認証なしのAPIではdraftリリースは返されない（常にfalse相当）
        const releases: Release[] = data
            .filter((r: any) => !r.draft)
            .map((r: any) => ({
                tagName: r.tag_name,
                name: r.name || r.tag_name,
                body: r.body || "",
                publishedAt: r.published_at,
                url: r.html_url,
                prerelease: r.prerelease,
                draft: r.draft,
            }));

        console.log(`✅ ${releases.length} releases after filtering`);

        return {
            repo,
            displayName: config.displayName,
            owner,
            releases,
        };
    } catch (error) {
        console.warn(`⚠️ Error fetching releases for ${owner}/${repo}:`, error);
        return {
            repo,
            displayName: config.displayName,
            owner,
            releases: [],
        };
    }
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
        return "Today";
    } else if (diffDays === 1) {
        return "Yesterday";
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)} weeks ago`;
    } else {
        return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }
}

function truncateBody(body: string, maxLength: number): string {
    if (!body || body.length <= maxLength) {
        return body || "_No release notes provided_";
    }

    // マークダウンの見出しやリストアイテムを優先して保持
    const lines = body.split("\n");
    let result = "";
    let currentLength = 0;

    for (const line of lines) {
        // 空行はスキップ
        if (line.trim() === "") continue;

        // 見出し行は優先
        if (line.startsWith("#") || line.startsWith("##") || line.startsWith("###")) {
            if (currentLength + line.length + 1 <= maxLength) {
                result += line + "\n";
                currentLength += line.length + 1;
            }
            continue;
        }

        // リストアイテムも優先
        if (line.startsWith("-") || line.startsWith("*") || /^\d+\./.test(line)) {
            if (currentLength + line.length + 1 <= maxLength) {
                result += line + "\n";
                currentLength += line.length + 1;
            }
            continue;
        }

        // 通常のテキスト
        if (currentLength + line.length + 1 <= maxLength) {
            result += line + "\n";
            currentLength += line.length + 1;
        } else {
            // 残りのスペースがあれば部分的に追加
            const remaining = maxLength - currentLength;
            if (remaining > 10) {
                result += line.substring(0, remaining - 3) + "...";
            }
            break;
        }
    }

    return result.trim() || "_No release notes provided_";
}

function sanitizeMarkdown(text: string): string {
    // マークダウンの特殊文字をエスケープ
    return text
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/\n/g, "<br>");
}

export async function getReleases(): Promise<string> {
    try {
        console.log("🚀 Fetching releases from configured repositories...");

        // すべてのリポジトリのリリースを並行取得
        const repoReleases = await Promise.all(
            releaseRepos.map((repo) => fetchReleasesForRepo(repo))
        );

        // リリースがあるリポジトリのみフィルタ
        const reposWithReleases = repoReleases.filter((r) => r.releases.length > 0);

        if (reposWithReleases.length === 0) {
            return "## 🚀 Recent Releases\n\n_No recent releases found_";
        }

        // すべてのリリースをフラット化して日付順にソート
        const allReleases: Array<{
            repo: string;
            displayName: string;
            owner: string;
            release: Release;
        }> = [];

        for (const repo of reposWithReleases) {
            for (const release of repo.releases) {
                allReleases.push({
                    repo: repo.repo,
                    displayName: repo.displayName,
                    owner: repo.owner,
                    release,
                });
            }
        }

        // 公開日順にソート（新しい順）
        allReleases.sort(
            (a, b) =>
                new Date(b.release.publishedAt).getTime() -
                new Date(a.release.publishedAt).getTime()
        );

        // 最大表示数に制限
        const limitedReleases = allReleases.slice(0, MAX_RELEASES_DISPLAY);

        // マークダウン生成
        let markdown = "## 🚀 Recent Releases\n\n";

        for (const item of limitedReleases) {
            const { repo, displayName, owner, release } = item;
            const dateStr = formatDate(release.publishedAt);
            const truncatedBody = truncateBody(release.body, MAX_RELEASE_NOTE_LENGTH);

            markdown += `<details>\n`;
            markdown += `<summary>\n`;
            markdown += `<strong>${displayName}</strong> <a href="${release.url}">${release.tagName}</a> · ${dateStr}\n`;
            markdown += `</summary>\n\n`;

            if (release.name && release.name !== release.tagName) {
                markdown += `**${release.name}**\n\n`;
            }

            markdown += truncatedBody;
            markdown += `\n\n[View on GitHub](${release.url})\n`;
            markdown += `</details>\n\n`;
        }

        return markdown.trim();
    } catch (error) {
        console.error("❌ Error fetching releases:", error);
        return "## 🚀 Recent Releases\n\n_Error fetching releases. Please try again later._";
    }
}