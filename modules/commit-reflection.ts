import { githubUsername } from "../config/github";
import { geminiApiKey, geminiModel } from "../config/gemini";

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

async function getLast7DaysCommits(): Promise<Commit[]> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const since = sevenDaysAgo.toISOString();

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
          allCommits.push(...commits);
        }
      } catch (error) {
        // 個別リポジトリエラーは無視して続行
        console.debug(`Failed to fetch commits from ${repo}`);
      }
    }

    // コミットを時系列でソート
    allCommits.sort(
      (a, b) =>
        new Date(b.commit.author.date).getTime() -
        new Date(a.commit.author.date).getTime()
    );

    return allCommits;
  } catch (error) {
    console.error("Error fetching commits:", error);
    return [];
  }
}

async function generateReflection(commits: Commit[]): Promise<string> {
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  if (commits.length === 0) {
    return "🤖 Last 7 Days Summary:\n直近7日間、開発は行われていないようです。次の開発に向けて準備を整えましょう！�";
  }

  // 直近7日間のコミットを分析
  const commitMessages = commits.map((c) => `- ${c.commit.message}`).join("\n");

  const prompt = `あなたは開発者の週報を作成するアシスタントです。
以下の直近7日間のコミット情報を分析し、簡潔で親しみやすい活動サマリーを生成してください。

コミット数: ${commits.length}
コミット情報（最初の20件）:
${commitMessages.split("\n").slice(0, 20).join("\n")}

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
    throw new Error(
      `Failed to generate reflection: ${response.statusText} - ${JSON.stringify(
        errorData
      )}`
    );
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          text?: string;
        }>;
      };
    }>;
  };

  const generatedText =
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    "コメント生成に失敗しました";

  return `🤖 Last 7 Days Summary:\n${generatedText}`;
}

export async function commitReflection(): Promise<CommitReflectionResult> {
  try {
    const commits = await getLast7DaysCommits();

    if (commits.length === 0) {
      return {
        text: "🤖 Last 7 Days Summary:\n直近7日間、開発は行われていないようです。次の開発に向けて準備を整えましょう！�",
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
      text: "🤖 Last 7 Days Summary:\nコミット情報の取得に失敗しました",
      commitCount: 0,
    };
  }
}
