import { computeSuitDrawParams } from './suitPatternParams';
import { loadSuitTexture } from './suitTextureLoader';
import type { MockSuit } from '../data/mockSuits';

export interface Keypoint {
  x: number;
  y: number;
  score: number;
}

export interface BodyAnchors {
  shoulderLeft: { x: number; y: number };
  shoulderRight: { x: number; y: number };
  hipLeft: { x: number; y: number };
  hipRight: { x: number; y: number };
  neck: { x: number; y: number };
}

interface Point2D {
  x: number;
  y: number;
}

interface Quad {
  topLeft: Point2D;
  topRight: Point2D;
  bottomLeft: Point2D;
  bottomRight: Point2D;
}

interface CellBounds {
  /** セル内絶対座標（px） */
  left: number;
  top: number;
  right: number;
  bottom: number;
  collarX: number;
  collarY: number;
  shoulderY: number;
  shoulderLeftX: number;
  shoulderRightX: number;
  hipY: number;
  hipLeftX: number;
  hipRightX: number;
}

const boundsCache = new Map<string, CellBounds>();

export function keypointsToAnchors(
  keypoints: Keypoint[],
  direction: 0 | 90 | 180 | 270 = 0
): BodyAnchors | null {
  const kp = (i: number) => keypoints[i];
  const score = (i: number) => kp(i)?.score ?? 0;

  const ls = kp(5);
  const rs = kp(6);
  const hl = kp(11);
  const hr = kp(12);
  if (!ls || !rs || !hl || !hr) return null;

  const minScore = direction === 0 || direction === 180 ? 0.3 : 0.15;
  const hasLS = score(5) > minScore;
  const hasRS = score(6) > minScore;
  const hasHL = score(11) > minScore;
  const hasHR = score(12) > minScore;

  if (!hasHL || !hasHR) return null;
  if (!hasLS && !hasRS) return null;

  let shoulderLeft = { x: ls.x, y: ls.y };
  let shoulderRight = { x: rs.x, y: rs.y };

  const hipMid = { x: (hl.x + hr.x) / 2, y: (hl.y + hr.y) / 2 };
  const torsoLen = Math.abs(hipMid.y - (hasLS ? ls.y : rs.y));

  if (!hasLS && hasRS) {
    const span = Math.max(torsoLen * 0.38, 48);
    shoulderLeft = { x: rs.x - span, y: rs.y };
  } else if (hasLS && !hasRS) {
    const span = Math.max(torsoLen * 0.38, 48);
    shoulderRight = { x: ls.x + span, y: ls.y };
  }

  const shoulderMid = {
    x: (shoulderLeft.x + shoulderRight.x) / 2,
    y: (shoulderLeft.y + shoulderRight.y) / 2,
  };

  const neck = score(0) > 0.2 && kp(0)
    ? { x: kp(0).x, y: kp(0).y }
    : {
        x: shoulderMid.x,
        y: shoulderMid.y - Math.max(18, torsoLen * 0.12),
      };

  return {
    shoulderLeft,
    shoulderRight,
    hipLeft: { x: hl.x, y: hl.y },
    hipRight: { x: hr.x, y: hr.y },
    neck,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function getSpriteConfig(
  suit: MockSuit,
  direction: 0 | 90 | 180 | 270
): { col: number; flipH: boolean; sheetCols: number } {
  const sheetCols = suit.textures.sheetCols || 4;
  const custom = suit.textures.directions?.[direction];
  if (custom) {
    return { col: custom.col, flipH: custom.flipH ?? false, sheetCols };
  }
  switch (direction) {
    case 0:
      return { col: Math.min(1, sheetCols - 1), flipH: false, sheetCols };
    case 90:
      return { col: Math.min(2, sheetCols - 1), flipH: true, sheetCols };
    case 180:
      return { col: Math.min(Math.floor(sheetCols / 2), sheetCols - 1), flipH: false, sheetCols };
    case 270:
      return { col: Math.min(1, sheetCols - 1), flipH: false, sheetCols };
    default:
      return { col: 0, flipH: false, sheetCols };
  }
}

/** スプライトセル内のスーツ実寸（透過ピクセル）を計測 */
function measureCellBounds(texture: HTMLCanvasElement, col: number, sheetCols: number): CellBounds {
  const cacheKey = `${texture.width}x${texture.height}:${sheetCols}:${col}`;
  const cached = boundsCache.get(cacheKey);
  if (cached) return cached;

  const cellW = Math.floor(texture.width / sheetCols);
  const cellH = texture.height;
  const baseX = col * cellW;

  const ctx = texture.getContext('2d');
  if (!ctx) {
    return fallbackBounds(baseX, cellW, cellH);
  }

  const imageData = ctx.getImageData(baseX, 0, cellW, cellH);
  const { data, width, height } = imageData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 24) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    return fallbackBounds(baseX, cellW, cellH);
  }

  const contentW = maxX - minX;
  const contentH = maxY - minY;
  const absLeft = baseX + minX;
  const absRight = baseX + maxX;

  const bounds: CellBounds = {
    left: absLeft,
    top: minY,
    right: absRight,
    bottom: maxY,
    collarX: baseX + minX + contentW * 0.5,
    collarY: minY + contentH * 0.04,
    shoulderY: minY + contentH * 0.1,
    shoulderLeftX: baseX + minX + contentW * 0.1,
    shoulderRightX: baseX + maxX - contentW * 0.1,
    hipY: minY + contentH * 0.46,
    hipLeftX: baseX + minX + contentW * 0.14,
    hipRightX: baseX + maxX - contentW * 0.14,
  };

  boundsCache.set(cacheKey, bounds);
  return bounds;
}

function fallbackBounds(baseX: number, cellW: number, cellH: number): CellBounds {
  const padX = cellW * 0.12;
  const padY = cellH * 0.04;
  return {
    left: baseX + padX,
    top: padY,
    right: baseX + cellW - padX,
    bottom: cellH - padY,
    collarX: baseX + cellW * 0.5,
    collarY: padY + cellH * 0.02,
    shoulderY: padY + cellH * 0.1,
    shoulderLeftX: baseX + padX + cellW * 0.06,
    shoulderRightX: baseX + cellW - padX - cellW * 0.06,
    hipY: padY + cellH * 0.46,
    hipLeftX: baseX + padX + cellW * 0.08,
    hipRightX: baseX + cellW - padX - cellW * 0.08,
  };
}

interface PlacementSpec {
  srcLeft: number;
  srcTop: number;
  srcW: number;
  srcH: number;
  quad: Quad;
  flipH: boolean;
}

/**
 * テクスチャ内スーツ肩幅 ↔ ユーザー肩幅を 1:1 に合わせた配置
 */
function buildPlacement(
  bounds: CellBounds,
  anchors: BodyAnchors,
  direction: 0 | 90 | 180 | 270,
  shoulderWidth: number,
  torsoLength: number,
  jacketLength: number,
  flipH: boolean
): PlacementSpec {
  const { shoulderLeft: sl, shoulderRight: sr, hipLeft: hl, hipRight: hr, neck } = anchors;
  const shoulderMid = { x: (sl.x + sr.x) / 2, y: (sl.y + sr.y) / 2 };
  const hipMid = { x: (hl.x + hr.x) / 2, y: (hl.y + hr.y) / 2 };
  const hipWidth = Math.hypot(hr.x - hl.x, hr.y - hl.y);
  const measuredShoulder = Math.hypot(sr.x - sl.x, sr.y - sl.y);

  const texShoulderSpan = Math.max(bounds.shoulderRightX - bounds.shoulderLeftX, 1);

  const collarAnchor: Point2D = {
    x: neck.x * 0.35 + shoulderMid.x * 0.65,
    y: Math.min(neck.y + torsoLength * 0.06, shoulderMid.y - 6),
  };

  const srcLeft = bounds.left;
  const srcTop = bounds.top;
  const srcW = bounds.right - bounds.left;
  const srcH = bounds.bottom - bounds.top;

  if (direction === 0 || direction === 180) {
    const scale = shoulderWidth / texShoulderSpan;
    const bottomY = hipMid.y + jacketLength * 0.95;

    const mapTex = (tx: number, ty: number): Point2D => ({
      x: collarAnchor.x + (tx - bounds.collarX) * scale,
      y: collarAnchor.y + (ty - bounds.collarY) * scale,
    });

    const topLeft = mapTex(bounds.shoulderLeftX, bounds.shoulderY);
    const topRight = mapTex(bounds.shoulderRightX, bounds.shoulderY);
    const bottomLeft = mapTex(bounds.hipLeftX, bounds.hipY);
    const bottomRight = mapTex(bounds.hipRightX, bounds.hipY);

    return {
      srcLeft,
      srcTop,
      srcW,
      srcH,
      flipH,
      quad: {
        topLeft,
        topRight,
        bottomLeft: {
          x: lerp(bottomLeft.x, hipMid.x - hipWidth * 0.52, 0.35),
          y: bottomY,
        },
        bottomRight: {
          x: lerp(bottomRight.x, hipMid.x + hipWidth * 0.52, 0.35),
          y: bottomY,
        },
      },
    };
  }

  // 側面: 肩キーポイントが近くても体厚ベースで幅を確保
  const facingRight = direction === 90;
  const visibleShoulder = facingRight ? sr : sl;
  const visibleHip = facingRight ? hr : hl;
  const bodyDepth = Math.max(
    measuredShoulder * 2.2,
    hipWidth * 0.92,
    torsoLength * 0.55,
    shoulderWidth * 0.95,
    110
  );

  const sideCollar: Point2D = {
    x: visibleShoulder.x,
    y: Math.min(neck.y + torsoLength * 0.04, visibleShoulder.y - 8),
  };

  const scale = bodyDepth / texShoulderSpan;
  const bottomY = visibleHip.y + jacketLength * 0.9;

  const mapTexSide = (tx: number, ty: number): Point2D => ({
    x: sideCollar.x + (tx - bounds.collarX) * scale,
    y: sideCollar.y + (ty - bounds.collarY) * scale,
  });

  const topLeft = mapTexSide(bounds.shoulderLeftX, bounds.shoulderY);
  const topRight = mapTexSide(bounds.shoulderRightX, bounds.shoulderY);
  void mapTexSide(bounds.hipLeftX, bounds.hipY);
  void mapTexSide(bounds.hipRightX, bounds.hipY);

  const depthSign = facingRight ? 1 : -1;
  const centerX = visibleShoulder.x + bodyDepth * 0.08 * depthSign;

  return {
    srcLeft,
    srcTop,
    srcW,
    srcH,
    flipH,
    quad: {
      topLeft: { x: centerX - bodyDepth * 0.52, y: topLeft.y },
      topRight: { x: centerX + bodyDepth * 0.48, y: topRight.y },
      bottomLeft: { x: centerX - bodyDepth * 0.46, y: bottomY },
      bottomRight: { x: centerX + bodyDepth * 0.44, y: bottomY },
    },
  };
}

/** 台形ワープ（水平スライス） */
function drawWarpedTexture(
  ctx: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  quad: Quad,
  flipH: boolean,
  slices = 32
) {
  const { topLeft, topRight, bottomLeft, bottomRight } = quad;

  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const srcY = sy + sh * t0;
    const srcH = sh * (t1 - t0);

    const leftX0 = lerp(topLeft.x, bottomLeft.x, t0);
    const leftX1 = lerp(topLeft.x, bottomLeft.x, t1);
    const rightX0 = lerp(topRight.x, bottomRight.x, t0);
    const rightX1 = lerp(topRight.x, bottomRight.x, t1);
    const y0 = lerp(topLeft.y, bottomLeft.y, t0);
    const y1 = lerp(topLeft.y, bottomLeft.y, t1);

    const destLeft = (leftX0 + leftX1) / 2;
    const destRight = (rightX0 + rightX1) / 2;
    const destW = destRight - destLeft;
    const destH = y1 - y0;

    if (destW <= 1 || destH <= 0) continue;

    ctx.save();
    if (flipH) {
      ctx.translate(destLeft + destW, y0);
      ctx.scale(-1, 1);
      ctx.drawImage(texture, sx, srcY, sw, srcH, 0, 0, destW, destH);
    } else {
      ctx.drawImage(texture, sx, srcY, sw, srcH, destLeft, y0, destW, destH);
    }
    ctx.restore();
  }
}

export async function renderSuitComposite(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  direction: 0 | 90 | 180 | 270,
  keypoints: Keypoint[],
  suit: MockSuit,
  bodyType: string,
  sleeveLengthCm: number
): Promise<void> {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(photo, 0, 0, w, h);

  const anchors = keypointsToAnchors(keypoints, direction);
  if (!anchors) return;

  const params = computeSuitDrawParams(anchors, bodyType, sleeveLengthCm);
  const texture = await loadSuitTexture(suit.textures.sheet, suit.textures.tintHex);
  const { col, flipH, sheetCols } = getSpriteConfig(suit, direction);
  const bounds = measureCellBounds(texture, col, sheetCols);

  const placement = buildPlacement(
    bounds,
    anchors,
    direction,
    params.shoulderWidth,
    params.torsoLength,
    params.jacketLength,
    flipH
  );

  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';

  drawWarpedTexture(
    ctx,
    texture,
    placement.srcLeft,
    placement.srcTop,
    placement.srcW,
    placement.srcH,
    placement.quad,
    placement.flipH
  );

  ctx.restore();
}

export function clearSuitBoundsCache(): void {
  boundsCache.clear();
}
