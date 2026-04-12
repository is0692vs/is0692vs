export async function fetchWithRetry(
  url: string | URL,
  options?: RequestInit,
  maxRetries = 3,
  initialDelayMs = 1000
): Promise<Response> {
  let delayMs = initialDelayMs;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);

      // 成功した場合、または4xx系エラー（429以外）の場合はそのまま返す
      if (response.ok || (response.status >= 400 && response.status < 500 && response.status !== 429)) {
        return response;
      }

      // サーバーエラー(5xx)またはレート制限(429)の場合はリトライ
      if (response.status >= 500 || response.status === 429) {
        console.warn(
          `[Retry ${i + 1}/${maxRetries}] Request failed with status ${
            response.status
          } for ${url}`
        );
        if (i === maxRetries - 1) {
          return response; // 最後の試行で失敗した場合はそのまま返す
        }
      }
    } catch (error) {
      console.warn(
        `[Retry ${i + 1}/${maxRetries}] Network error for ${url}:`,
        error
      );
      if (i === maxRetries - 1) {
        throw error;
      }
    }

    // エクスポネンシャルバックオフで待機
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayMs *= 2;
  }

  throw new Error(`Failed after ${maxRetries} retries for ${url}`);
}
