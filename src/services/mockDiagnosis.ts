import type { ScanPayload } from '../components/PoseEstimation';
import type { DiagnosisData } from '../components/DiagnosisResult';
import { MOCK_SUITS } from '../data/mockSuits';
import { jacketSizeFromBodyType } from '../data/suitSizes';

/** バックエンド未接続時（Azure Static Web Apps 等）のフォールバック診断 */
export function buildMockDiagnosis(payload: ScanPayload): DiagnosisData {
  const m = payload.aggregatedMetrics;
  const shoulder = m.shoulderWidth || 180;
  const hip = m.hipWidth || 160;
  const bodyH = m.torsoLength + m.legLength + m.neckLength || 600;
  const shoulderRatio = shoulder / bodyH;
  const shHip = shoulder / (hip || 1);

  let bodyType = 'A体 (標準)';
  if (shoulderRatio < 0.228 && shHip > 1.02) bodyType = 'YA体 (スリム)';
  else if (shoulderRatio > 0.258 || shHip > 1.08) bodyType = 'AB体 (がっしり)';
  else if (hip / bodyH > 0.36 || shHip < 0.98) bodyType = 'BE体 (ゆったり)';

  let skeleton = 'ナチュラル';
  if (Math.abs(shHip - 1) < 0.03) skeleton = 'ストレート';
  else if (shHip < 0.97) skeleton = 'ウェーブ';

  const height = payload.height || 170;
  const jacketSize = jacketSizeFromBodyType(bodyType);

  return {
    skeleton,
    bodyType,
    personalColor: {
      colorType: 'ブルベ・冬',
      recommendedColors: ['ネイビー', 'チャコール', 'ミディアムグレー', 'ダークブラウン'],
    },
    suitSize: {
      jacketSize,
      sleeveLengthCm: Math.round(height * 0.32),
      hemLengthCm: Math.round(height * 0.47),
      fit: '標準シルエット',
    },
    recommendedSuits: MOCK_SUITS.slice(0, 3).map((s, i) => ({
      id: s.id,
      name: s.name,
      color: s.colorName,
      imageUrl: s.textures.sheet,
      matchPercentage: s.matchBase - i,
    })),
  };
}
