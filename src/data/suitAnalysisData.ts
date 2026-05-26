/** スーツごとの印象・シーン適正（フロントエンドモック） */

export interface ImpressionScore {
  sincere: number;
  friendly: number;
  youthful: number;
  soft: number;
  sharp: number;
  glamorous: number;
}

export interface SceneScore {
  scene: string;
  suitability: '◎' | '○' | '△';
  percentage: number;
  description: string;
}

export const IMPRESSION_LABELS: Record<keyof ImpressionScore, string> = {
  sincere: '誠実',
  friendly: '親しみやすい',
  youthful: '若々しい',
  soft: '柔らかい',
  sharp: 'シャープ',
  glamorous: '華やか',
};

export const SUIT_IMPRESSIONS: Record<string, ImpressionScore> = {
  'suit-001': { sincere: 0.92, friendly: 0.68, youthful: 0.55, soft: 0.62, sharp: 0.88, glamorous: 0.45 },
  'suit-002': { sincere: 0.85, friendly: 0.72, youthful: 0.58, soft: 0.70, sharp: 0.82, glamorous: 0.52 },
  'suit-003': { sincere: 0.78, friendly: 0.80, youthful: 0.72, soft: 0.85, sharp: 0.65, glamorous: 0.60 },
  'suit-004': { sincere: 0.88, friendly: 0.65, youthful: 0.48, soft: 0.55, sharp: 0.90, glamorous: 0.70 },
  'suit-005': { sincere: 0.75, friendly: 0.78, youthful: 0.65, soft: 0.75, sharp: 0.72, glamorous: 0.82 },
};

export const SUIT_SCENES: Record<string, SceneScore[]> = {
  'suit-001': [
    { scene: 'ビジネス', suitability: '◎', percentage: 95, description: '定番ネイビーで信頼感のある印象' },
    { scene: '就活・面接', suitability: '◎', percentage: 92, description: 'フォーマルシーンに最適' },
    { scene: 'パーティー', suitability: '△', percentage: 45, description: 'フォーマルすぎる場合あり' },
    { scene: 'カジュアル', suitability: '△', percentage: 38, description: 'ビジネス向け' },
  ],
  'suit-002': [
    { scene: 'ビジネス', suitability: '◎', percentage: 90, description: '知的なグレーで洗練された印象' },
    { scene: '就活・面接', suitability: '○', percentage: 78, description: '落ち着いた色味で好印象' },
    { scene: 'パーティー', suitability: '○', percentage: 72, description: '上品な華やかさ' },
    { scene: 'カジュアル', suitability: '△', percentage: 50, description: 'ビジネスカジュアル向け' },
  ],
  'suit-003': [
    { scene: 'ビジネス', suitability: '○', percentage: 75, description: '柔らかい印象で親しみやすい' },
    { scene: '就活・面接', suitability: '○', percentage: 70, description: '明るめトーンで好印象' },
    { scene: 'パーティー', suitability: '◎', percentage: 88, description: '華やかで注目を集める' },
    { scene: 'カジュアル', suitability: '○', percentage: 68, description: 'カジュアルシーンにも合う' },
  ],
  'suit-004': [
    { scene: 'ビジネス', suitability: '◎', percentage: 93, description: 'クラシックな格式で誠実な印象' },
    { scene: '就活・面接', suitability: '◎', percentage: 90, description: '就活の定番スタイル' },
    { scene: 'パーティー', suitability: '○', percentage: 65, description: 'フォーマルな場に適する' },
    { scene: 'カジュアル', suitability: '△', percentage: 42, description: 'フォーマル向け' },
  ],
  'suit-005': [
    { scene: 'ビジネス', suitability: '○', percentage: 80, description: 'モダンでスタイリッシュ' },
    { scene: '就活・面接', suitability: '○', percentage: 72, description: '個性を出しすぎない範囲' },
    { scene: 'パーティー', suitability: '◎', percentage: 92, description: '華やかなシーンに映える' },
    { scene: 'カジュアル', suitability: '○', percentage: 75, description: 'こなれた着こなし向け' },
  ],
};

export function getTopImpressionLabels(suitId: string, count = 2): string[] {
  const scores = SUIT_IMPRESSIONS[suitId];
  if (!scores) return [];
  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, count)
    .map(([key]) => IMPRESSION_LABELS[key as keyof ImpressionScore]);
}

export function getTopScenes(suitId: string, count = 2): string[] {
  const scenes = SUIT_SCENES[suitId] ?? [];
  return scenes
    .filter((s) => s.suitability === '◎' || s.suitability === '○')
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, count)
    .map((s) => s.scene);
}
