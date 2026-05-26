/** 骨格タイプ・パーソナルカラーの表示ラベルと説明文 */
export const SKELETON_LABELS: Record<
  string,
  { label: string; description: string }
> = {
  ストレート: {
    label: 'ストレート',
    description:
      '肩と腰のバランスが整った直線的なシルエット。シンプルで端正なラインのスーツが最も似合います。',
  },
  ウェーブ: {
    label: 'ウェーブ',
    description:
      '曲線的で女性らしいシルエット。ウエストシェイプの効いた、ソフトな素材のスーツが似合います。',
  },
  ナチュラル: {
    label: 'ナチュラル',
    description:
      '骨感があり、ラフでカジュアルな雰囲気。ゆったりとしたシルエットや天然素材が似合います。',
  },
};

export const COLOR_LABELS: Record<
  string,
  { label: string; description: string }
> = {
  'イエベ・春': {
    label: 'イエベ・春',
    description: '明るく暖かみのある色味。ベージュやコーラルなどが似合います。',
  },
  'イエベ・秋': {
    label: 'イエベ・秋',
    description: '深みのある暖色系。ネイビーやキャメル、オリーブが似合います。',
  },
  'ブルベ・夏': {
    label: 'ブルベ・夏',
    description: 'ソフトで涼しげな色味。ライトグレーやラベンダーグレーが似合います。',
  },
  'ブルベ・冬': {
    label: 'ブルベ・冬',
    description: 'コントラストの効いた寒色系。チャコールやロイヤルブルーが似合います。',
  },
};

export function getSkeletonInfo(value: string) {
  return (
    SKELETON_LABELS[value] || {
      label: value || 'ストレート',
      description: 'あなたの骨格に合わせたスーツをご提案します。',
    }
  );
}

export function getColorInfo(value: string) {
  return (
    COLOR_LABELS[value] || {
      label: value || 'イエベ・秋',
      description: '肌のトーンに合う色味をご提案します。',
    }
  );
}
