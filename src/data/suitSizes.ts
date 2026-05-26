import type { DiagnosisData } from '../components/DiagnosisResult';

export const AVAILABLE_SUIT_SIZES = [
  'YA4',
  'YA5',
  'A4',
  'A5',
  'A6',
  'AB5',
  'AB6',
  'BE5',
  'BE6',
] as const;

export type SuitSizeCode = (typeof AVAILABLE_SUIT_SIZES)[number];

export function resolveRecommendedSize(diagnosis: DiagnosisData): SuitSizeCode {
  const raw = diagnosis.suitSize.jacketSize.replace(/R$/i, '').trim();
  if (AVAILABLE_SUIT_SIZES.includes(raw as SuitSizeCode)) {
    return raw as SuitSizeCode;
  }

  if (diagnosis.bodyType.includes('YA')) return 'YA5';
  if (diagnosis.bodyType.includes('AB')) return 'AB5';
  if (diagnosis.bodyType.includes('BE')) return 'BE5';
  return 'A5';
}

export function jacketSizeFromBodyType(bodyType: string): SuitSizeCode {
  if (bodyType.includes('YA')) return 'YA5';
  if (bodyType.includes('AB')) return 'AB5';
  if (bodyType.includes('BE')) return 'BE5';
  return 'A5';
}
