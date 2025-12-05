/**
 * 直近何日間を対象とするかの設定
 * このファイルでは、コミット振り返り（commit-reflection）、
 * アクティブプロジェクト判定（active-projects）、
 * Spotify TOP曲（spotify-top-tracks）で使用する日数を管理します。
 *
 * この定数を変更すると、以下の機能に自動的に反映されます：
 * - Gemini AIサマリーの対象期間
 * - アクティブプロジェクト判定の期間
 * - Spotify TOP曲の期間表示
 * - README生成時のタイトル表示
 */

export const COMMIT_DAYS_RANGE = 30; // コミット履歴用
export const GRAPH_DAYS_RANGE = 30; // グラフ用

// 後方互換性のために残す（将来的に削除）
export const DAYS_RANGE = GRAPH_DAYS_RANGE;
