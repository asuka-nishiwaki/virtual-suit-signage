/** 撮影キャンバス解像度（PoseEstimation / VirtualTryOn 共通） */
export const CANVAS_W = 720;
export const CANVAS_H = 1280;

export interface Point2D {
  x: number;
  y: number;
}

export interface MappedKeypoint extends Point2D {
  name?: string;
  score: number;
}

/**
 * MoveNet の video 座標 → キャンバス座標（cover フィット + ミラー）
 * mirror=true: 保存画像・試着合成と同じ最終ピクセル座標
 * mirror=false: drawScene 内の反転済み ctx 上で描くときの座標
 */
export function mapVideoPointToCanvas(
  x: number,
  y: number,
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number = CANVAS_W,
  canvasHeight: number = CANVAS_H,
  mirror = true
): Point2D {
  if (videoWidth <= 0 || videoHeight <= 0) {
    return { x, y };
  }

  const scale = Math.max(canvasWidth / videoWidth, canvasHeight / videoHeight);
  const dw = videoWidth * scale;
  const dh = videoHeight * scale;
  const dx = (canvasWidth - dw) / 2;
  const dy = (canvasHeight - dh) / 2;

  let cx = x * scale + dx;
  const cy = y * scale + dy;

  if (mirror) {
    cx = canvasWidth - cx;
  }

  return { x: cx, y: cy };
}

export function mapKeypointsToCanvas<T extends { x: number; y: number; name?: string; score?: number }>(
  keypoints: T[],
  videoWidth: number,
  videoHeight: number,
  canvasWidth: number = CANVAS_W,
  canvasHeight: number = CANVAS_H,
  mirror = true
): MappedKeypoint[] {
  return keypoints.map((kp) => {
    const mapped = mapVideoPointToCanvas(
      kp.x,
      kp.y,
      videoWidth,
      videoHeight,
      canvasWidth,
      canvasHeight,
      mirror
    );
    return {
      name: kp.name,
      score: kp.score ?? 0,
      x: mapped.x,
      y: mapped.y,
    };
  });
}
