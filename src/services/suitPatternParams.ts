/** 型紙サイズパラメータ（YA体 / A体 / AB体 / BE体） */
export interface PatternScale {
  shoulder: number;
  waist: number;
  chest: number;
  sleeve: number;
  length: number;
  lapelWidth: number;
}

const PATTERN_BY_BODY: Record<string, PatternScale> = {
  'YA体 (スリム)': {
    shoulder: 0.90,
    waist: 0.86,
    chest: 0.88,
    sleeve: 0.96,
    length: 0.98,
    lapelWidth: 0.85,
  },
  'A体 (標準)': {
    shoulder: 1.0,
    waist: 1.0,
    chest: 1.0,
    sleeve: 1.0,
    length: 1.0,
    lapelWidth: 1.0,
  },
  'AB体 (がっしり)': {
    shoulder: 1.08,
    waist: 1.06,
    chest: 1.10,
    sleeve: 1.04,
    length: 1.02,
    lapelWidth: 1.1,
  },
  'BE体 (ゆったり)': {
    shoulder: 1.14,
    waist: 1.12,
    chest: 1.15,
    sleeve: 1.06,
    length: 1.04,
    lapelWidth: 1.15,
  },
};

export function getPatternScale(bodyType: string): PatternScale {
  return PATTERN_BY_BODY[bodyType] || PATTERN_BY_BODY['A体 (標準)'];
}

export interface BodyAnchors {
  shoulderLeft: { x: number; y: number };
  shoulderRight: { x: number; y: number };
  hipLeft: { x: number; y: number };
  hipRight: { x: number; y: number };
  neck: { x: number; y: number };
  elbowLeft?: { x: number; y: number };
  elbowRight?: { x: number; y: number };
  wristLeft?: { x: number; y: number };
  wristRight?: { x: number; y: number };
}

export interface SuitDrawParams {
  shoulderWidth: number;
  torsoLength: number;
  sleeveLength: number;
  jacketLength: number;
  pattern: PatternScale;
}

export function computeSuitDrawParams(
  anchors: BodyAnchors,
  bodyType: string,
  sleeveLengthCm: number
): SuitDrawParams {
  const pattern = getPatternScale(bodyType);
  const shoulderWidth = Math.hypot(
    anchors.shoulderRight.x - anchors.shoulderLeft.x,
    anchors.shoulderRight.y - anchors.shoulderLeft.y
  );
  const hipMidY = (anchors.hipLeft.y + anchors.hipRight.y) / 2;
  const shoulderMidY = (anchors.shoulderLeft.y + anchors.shoulderRight.y) / 2;
  const torsoLength = hipMidY - shoulderMidY;

  const sleeveScale = sleeveLengthCm / 60;
  const sleeveLength = shoulderWidth * 0.55 * pattern.sleeve * sleeveScale;

  return {
    shoulderWidth: shoulderWidth * pattern.shoulder,
    torsoLength: torsoLength * pattern.length,
    sleeveLength,
    jacketLength: torsoLength * 1.15 * pattern.length,
    pattern,
  };
}
