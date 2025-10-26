import { githubUsername } from "../config/github";
import { geminiApiKey, geminiModel } from "../config/gemini";
import { DAYS_RANGE } from "../config/days-range";

interface Commit {
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  author?: {
    login: string;
  };
  files?: Array<{
    filename: string;
    changes: number;
  }>;
  stats?: {
    total: number;
    additions: number;
    deletions: number;
  };
}

interface CommitReflectionResult {
  text: string;
  commitCount: number;
}

async function getRepositories(): Promise<string[]> {
  // GitHubユーザーのリポジトリ一覧を取得
  const url = `https://api.github.com/users/${githubUsername}/repos?per_page=100&sort=updated`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${process.env.GH_PAT}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repositories: ${response.statusText}`);
  }

  const repos = (await response.json()) as Array<{
    name: string;
  }>;

  return repos.map((r) => r.name);
}

async function getLastNDaysCommits(): Promise<Commit[]> {
  const nDaysAgo = new Date();
  nDaysAgo.setDate(nDaysAgo.getDate() - DAYS_RANGE);
  nDaysAgo.setHours(0, 0, 0, 0);

  const since = nDaysAgo.toISOString();

  try {
    // リポジトリ一覧を取得
    const repos = await getRepositories();

    // 各リポジトリからコミットを取得
    const allCommits: Commit[] = [];

    for (const repo of repos) {
      try {
        const url = `https://api.github.com/repos/${githubUsername}/${repo}/commits?since=${since}&author=${githubUsername}&per_page=100`;

        const response = await fetch(url, {
          headers: {
            Authorization: `token ${process.env.GH_PAT}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (response.ok) {
          const commits = (await response.json()) as Commit[];
          
          // 各コミットの詳細情報を取得（変更数を含む）
          for (const commit of commits) {
            try {
              // コミットのSHAはcommit.sha、またはcommit.commit.treeを使用
              // GitHubコミット一覧APIの結果にはshaフィールドがある
              const commitSha = (commit as any).sha;
              if (!commitSha) continue;

              const detailUrl = `https://api.github.com/repos/${githubUsername}/${repo}/commits/${commitSha}`;
              const detailResponse = await fetch(detailUrl, {
                headers: {
                  Authorization: `token ${process.env.GH_PAT}`,
                  Accept: "application/vnd.github.v3+json",
                },
              });

              if (detailResponse.ok) {
                const detailData = (await detailResponse.json()) as any;
                commit.stats = detailData.stats || { total: 0, additions: 0, deletions: 0 };
                commit.files = detailData.files || [];
              }
            } catch (error) {
              console.debug(`Failed to fetch commit details for ${repo}`);
              // 詳細取得失敗時はデフォルト値を設定
              if (!commit.stats) {
                commit.stats = { total: 0, additions: 0, deletions: 0 };
              }
            }
          }

          allCommits.push(...commits);
        }
      } catch (error) {
        // 個別リポジトリエラーは無視して続行
        console.debug(`Failed to fetch commits from ${repo}`);
      }
    }

    // 変更行数（additions + deletions）が多い順でソート、同じ行数の場合は時系列（新しい順）
    allCommits.sort((a, b) => {
      // 変更行数 = additions + deletions (実際のコード変更量を反映)
      const aLineChanges = (a.stats?.additions || 0) + (a.stats?.deletions || 0);
      const bLineChanges = (b.stats?.additions || 0) + (b.stats?.deletions || 0);
      
      if (bLineChanges !== aLineChanges) {
        return bLineChanges - aLineChanges; // 変更行数が多い順
      }
      
      // 同じ変更行数の場合は時系列でソート
      return (
        new Date(b.commit.author.date).getTime() -
        new Date(a.commit.author.date).getTime()
      );
    });

    return allCommits;
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
}

// Geminiがエラーで応答できない場合のフォールバック
function generateFallbackSummary(topCommits: Commit[], totalCommitCount: number): string {
  if (topCommits.length === 0) {
    return `直近${DAYS_RANGE}日間の活動サマリー:\n直近${DAYS_RANGE}日間、開発は行われていないようです。次の開発に向けて準備を整えましょう！🚀`;
  }

  // コミットメッセージから主な作業を抽出
  const mainActivities = topCommits
    .slice(0, 3)
    .map((c) => c.commit.message.split("\n")[0])
    .join("、");

  // 総変更行数を計算
  const totalLineChanges = topCommits.reduce((sum, c) => {
    return sum + (c.stats?.additions || 0) + (c.stats?.deletions || 0);
  }, 0);

  return `直近${DAYS_RANGE}日間の活動サマリー:\n直近${DAYS_RANGE}日間で${totalCommitCount}件ものコミット、お疲れ様です！👏 ${mainActivities}など、多くの作業を進められました。合計${totalLineChanges}行の変更を加えられるなど、精力的な開発が行われています。これからも応援しています！✨`;
}

async function generateReflection(commits: Commit[]): Promise<string> {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  if (commits.length === 0) {
    return `直近${DAYS_RANGE}日間の活動サマリー:\n直近${DAYS_RANGE}日間、開発は行われていないようです。次の開発に向けて準備を整えましょう！🚀`;
  }

  // 変更行数が多い上位20件のコミットを取得
  const topCommits = commits.slice(0, 20);
  const commitMessages = topCommits
    .map((c) => {
      const additions = c.stats?.additions || 0;
      const deletions = c.stats?.deletions || 0;
      const lineChanges = additions + deletions;
      return `- ${c.commit.message} (+${additions}/-${deletions})`;
    })
    .join("\n");

  const prompt = `あなたは開発者の週報を作成するアシスタントです。
以下の直近${DAYS_RANGE}日間のコミット情報を分析し、簡潔で親しみやすい活動サマリーを生成してください。

コミット数: ${commits.length}
コミット情報（変更行数が多い上位20件。形式: +追加行数/-削除行数）:
${commitMessages}

要件:
- 日本語で300文字以内
- コミット数と主な作業内容を簡潔に述べる
- ポジティブで励ましの言葉を含める
- 絵文字を適度に使用
- 「です・ます」調
- 敬体で応答する
- 余計な説明や前置きは不要
- 直接本文から始める`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    console.warn(`Gemini API error: ${response.statusText}`, errorData);
    // HTTPエラー時はフォールバックサマリーを返す
    return generateFallbackSummary(topCommits, commits.length);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
    error?: {
      message?: string;
      code?: number;
    };
  };

  // Geminiレスポンスエラーをチェック
  if (data.error) {
    console.warn(`Gemini API error: ${data.error.message}`, data.error);
    // エラー応答時はフォールバックサマリーを返す
    return generateFallbackSummary(topCommits, commits.length);
  }

  const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  // テキストが返されなかった場合（レート制限など）
  if (!generatedText) {
    console.warn("Gemini API returned empty response");
    return generateFallbackSummary(topCommits, commits.length);
  }

  return `直近${DAYS_RANGE}日間の活動サマリー:\n${generatedText}`;
}

export async function commitReflection(): Promise<CommitReflectionResult> {
  try {
    const commits = await getLastNDaysCommits();

    if (commits.length === 0) {
      return {
        text: `直近${DAYS_RANGE}日間の活動サマリー:\n直近${DAYS_RANGE}日間、開発は行われていないようです。次の開発に向けて準備を整えましょう！🚀`,
        commitCount: 0,
      };
    }

    const reflection = await generateReflection(commits);

    return {
      text: reflection,
      commitCount: commits.length,
    };
  } catch (error) {
    console.error("Error in commitReflection:", error);
    return {
      text: `直近${DAYS_RANGE}日間の活動サマリー:\nコミット情報の取得に失敗しました`,
      commitCount: 0,
    };
  }
}
