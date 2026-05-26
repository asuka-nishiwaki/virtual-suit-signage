import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as posedetection from '@tensorflow-models/pose-detection';
import { mapKeypointsToCanvas } from '../services/coordinateTransform';
import './PoseEstimation.css';

const CANVAS_W = 720;
const CANVAS_H = 1280;
const GUIDE_ASPECT = 9 / 16;
const GUIDE_STROKE = '#FF1493';
const GUIDE_LINE_WIDTH = 5.5;

const DIRECTION_STEPS = [
  { direction: 0 as const, label: '正面', turnHint: 'カメラを正面に向いて立ってください' },
  { direction: 90 as const, label: '右側', turnHint: '右側をカメラに向けてください' },
  { direction: 180 as const, label: '後ろ', turnHint: '背中をカメラに向けてください' },
  { direction: 270 as const, label: '左側', turnHint: '左側をカメラに向けてください' },
];

export interface CaptureData {
  direction: 0 | 90 | 180 | 270;
  directionLabel: string;
  keypoints: Array<{ name?: string; x: number; y: number; score: number }>;
  imageDataUrl: string;
  metrics: {
    shoulderWidth: number;
    hipWidth: number;
    torsoLength: number;
    armLength: number;
    legLength: number;
    neckLength: number;
    torsoDepth: number;
  };
}

export interface ScanPayload {
  height: number;
  weight: number;
  captures: CaptureData[];
  aggregatedMetrics: {
    shoulderWidth: number;
    hipWidth: number;
    torsoLength: number;
    armLength: number;
    legLength: number;
    neckLength: number;
    torsoDepth: number;
  };
  skinSamples: Array<{ r: number; g: number; b: number }>;
}

interface PoseEstimationProps {
  onDiagnosisComplete: (payload: ScanPayload) => void;
  isAnalyzing?: boolean;
}

function isVideoReady(video: HTMLVideoElement): boolean {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.videoHeight > 0 &&
    !video.paused
  );
}

function getKeypointScore(kp: posedetection.Keypoint | undefined): number {
  return kp?.score ?? 0;
}

function getDist(kp: posedetection.Keypoint[], i: number, j: number): number {
  const a = kp[i];
  const b = kp[j];
  if (!a || !b || getKeypointScore(a) < 0.3 || getKeypointScore(b) < 0.3) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function computeCaptureMetrics(
  keypoints: posedetection.Keypoint[],
  direction: number
) {
  const shoulderWidth = getDist(keypoints, 5, 6);
  const hipWidth = getDist(keypoints, 11, 12);
  const armLength =
    (getDist(keypoints, 5, 7) + getDist(keypoints, 7, 9) +
      getDist(keypoints, 6, 8) + getDist(keypoints, 8, 10)) /
    2;
  const legLength =
    (getDist(keypoints, 11, 13) + getDist(keypoints, 13, 15) +
      getDist(keypoints, 12, 14) + getDist(keypoints, 14, 16)) /
    2;

  const ls = keypoints[5];
  const rs = keypoints[6];
  const nose = keypoints[0];
  let neckLength = 0;
  if (ls && rs && nose && getKeypointScore(ls) > 0.3 && getKeypointScore(rs) > 0.3 && getKeypointScore(nose) > 0.3) {
    const midX = (ls.x + rs.x) / 2;
    const midY = (ls.y + rs.y) / 2;
    neckLength = Math.hypot(nose.x - midX, nose.y - midY);
  }

  const lh = keypoints[11];
  const rh = keypoints[12];
  let torsoLength = 0;
  if (ls && rs && lh && rh) {
    const shoulderY = (ls.y + rs.y) / 2;
    const hipY = (lh.y + rh.y) / 2;
    torsoLength = Math.abs(hipY - shoulderY);
  }

  let torsoDepth = 0;
  if (direction === 90 || direction === 270) {
    const points = [nose, ls, rs, lh, rh, keypoints[7], keypoints[8], keypoints[11], keypoints[12]]
      .filter((k) => k && getKeypointScore(k) > 0.3);
    const xs = points.map((k) => k!.x);
    const ys = points.map((k) => k!.y);
    if (xs.length >= 2) {
      torsoDepth = Math.max(...xs) - Math.min(...xs);
    }
    if (ys.length >= 2 && torsoDepth < 10) {
      torsoDepth = Math.max(torsoDepth, Math.max(...ys) - Math.min(...ys)) * 0.35;
    }
  }

  return {
    shoulderWidth,
    hipWidth,
    torsoLength,
    armLength,
    legLength,
    neckLength,
    torsoDepth,
  };
}

function sampleSkinFromVideo(
  video: HTMLVideoElement,
  keypoints: posedetection.Keypoint[]
): Array<{ r: number; g: number; b: number }> {
  const samples: Array<{ r: number; g: number; b: number }> = [];
  if (!video.videoWidth || !video.videoHeight) return samples;

  const offscreen = document.createElement('canvas');
  offscreen.width = video.videoWidth;
  offscreen.height = video.videoHeight;
  const ctx = offscreen.getContext('2d');
  if (!ctx) return samples;

  ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);

  const scaleX = video.videoWidth / CANVAS_W;
  const scaleY = video.videoHeight / CANVAS_H;

  const samplePoints = [
    { idx: 0, ox: 0, oy: 0 },
    { idx: 5, ox: -8, oy: 0 },
    { idx: 6, ox: 8, oy: 0 },
  ];

  for (const { idx, ox, oy } of samplePoints) {
    const kp = keypoints[idx];
    if (!kp || getKeypointScore(kp) < 0.3) continue;

    const x = Math.round(kp.x * scaleX + ox);
    const y = Math.round(kp.y * scaleY + oy);
    if (x < 0 || y < 0 || x >= offscreen.width || y >= offscreen.height) continue;

    try {
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if (pixel[3] === 0) continue;
      samples.push({ r: pixel[0], g: pixel[1], b: pixel[2] });
    } catch {
      // skip
    }
  }

  return samples;
}

function estimateBodyHeightCm(captures: CaptureData[]): number {
  const front = captures.find((c) => c.direction === 0) || captures[0];
  if (!front) return 170;

  const m = front.metrics;
  const estimates: number[] = [];

  if (m.legLength > 0) estimates.push(m.legLength / 0.47);
  if (m.torsoLength > 0) estimates.push(m.torsoLength / 0.3);
  const totalPx = m.legLength + m.torsoLength + m.neckLength;
  if (totalPx > 0) estimates.push(totalPx / 0.85);

  if (estimates.length === 0) return 170;
  const avgPxHeight = estimates.reduce((a, b) => a + b, 0) / estimates.length;
  return Math.round(Math.min(195, Math.max(150, avgPxHeight)));
}

function estimateWeightKg(heightCm: number, aggregated: ScanPayload['aggregatedMetrics']): number {
  const shoulderHip = aggregated.hipWidth > 0
    ? aggregated.shoulderWidth / aggregated.hipWidth
    : 1;
  const bulk = aggregated.torsoDepth > 0 && aggregated.shoulderWidth > 0
    ? aggregated.torsoDepth / aggregated.shoulderWidth
    : 0.15;
  const base = 22 * Math.pow(heightCm / 100, 2);
  const adjust = (shoulderHip - 1) * 4 + (bulk - 0.15) * 20;
  return Math.round(Math.min(95, Math.max(45, base + adjust)));
}

function aggregateMetrics(captures: CaptureData[]) {
  const front = captures.find((c) => c.direction === 0);
  const sides = captures.filter((c) => c.direction === 90 || c.direction === 270);

  const avg = (vals: number[]) => {
    const valid = vals.filter((v) => v > 0);
    return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
  };

  const shoulderWidth = front?.metrics.shoulderWidth || avg(captures.map((c) => c.metrics.shoulderWidth));
  const hipWidth = front?.metrics.hipWidth || avg(captures.map((c) => c.metrics.hipWidth));
  const sideDepths = sides.map((c) => c.metrics.torsoDepth).filter((d) => d > 0);

  return {
    shoulderWidth,
    hipWidth,
    torsoLength: avg(captures.map((c) => c.metrics.torsoLength)),
    armLength: avg(captures.map((c) => c.metrics.armLength)),
    legLength: avg(captures.map((c) => c.metrics.legLength)),
    neckLength: avg(captures.map((c) => c.metrics.neckLength)),
    torsoDepth: sideDepths.length ? Math.max(...sideDepths) : avg(sides.map((c) => c.metrics.torsoDepth)),
  };
}

export const PoseEstimation: React.FC<PoseEstimationProps> = ({
  onDiagnosisComplete,
  isAnalyzing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const detectorRef = useRef<posedetection.PoseDetector | null>(null);
  const latestPoseRef = useRef<posedetection.Pose | null>(null);
  const skinSamplesRef = useRef<Array<{ r: number; g: number; b: number }>>([]);
  const hasSubmittedRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const activeRef = useRef(true);

  const [stepIndex, setStepIndex] = useState(0);
  const [captures, setCaptures] = useState<CaptureData[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCountingDown, setIsCountingDown] = useState(false);

  const currentStep = DIRECTION_STEPS[stepIndex];
  const isComplete = captures.length >= 4;

  const getGuideRect = useCallback((canvas: HTMLCanvasElement) => {
    const guideWidth = canvas.width * 0.82;
    const guideHeight = Math.min(guideWidth / GUIDE_ASPECT, canvas.height * 0.78);
    const x = (canvas.width - guideWidth) / 2;
    const y = (canvas.height - guideHeight) / 2;
    return { x, y, width: guideWidth, height: guideHeight };
  }, []);

  const drawGuideFrame = (
    ctx: CanvasRenderingContext2D,
    rect: { x: number; y: number; width: number; height: number }
  ) => {
    ctx.strokeStyle = 'rgba(255, 20, 147, 0.75)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(255, 20, 147, 0.04)';
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  };

  const drawFrontSilhouette = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const cx = x + w / 2;
    const headR = w * 0.09;
    const headY = y + h * 0.1;
    const shoulderY = y + h * 0.22;
    const hipY = y + h * 0.48;
    const kneeY = y + h * 0.68;
    const ankleY = y + h * 0.88;
    const shoulderW = w * 0.32;
    const hipW = w * 0.22;
    const armRaise = w * 0.08;

    ctx.strokeStyle = GUIDE_STROKE;
    ctx.lineWidth = GUIDE_LINE_WIDTH;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.ellipse(cx, headY, headR, headR * 1.1, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, headY + headR);
    ctx.lineTo(cx, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - shoulderW / 2, shoulderY);
    ctx.lineTo(cx + shoulderW / 2, shoulderY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - hipW / 2, hipY);
    ctx.lineTo(cx + hipW / 2, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - shoulderW / 2, shoulderY);
    ctx.lineTo(cx - shoulderW / 2 - armRaise, shoulderY + h * 0.12);
    ctx.lineTo(cx - shoulderW / 2 - armRaise * 0.5, shoulderY + h * 0.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + shoulderW / 2, shoulderY);
    ctx.lineTo(cx + shoulderW / 2 + armRaise, shoulderY + h * 0.12);
    ctx.lineTo(cx + shoulderW / 2 + armRaise * 0.5, shoulderY + h * 0.2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - hipW / 2 + w * 0.04, hipY);
    ctx.lineTo(cx - w * 0.07, kneeY);
    ctx.lineTo(cx - w * 0.08, ankleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + hipW / 2 - w * 0.04, hipY);
    ctx.lineTo(cx + w * 0.07, kneeY);
    ctx.lineTo(cx + w * 0.08, ankleY);
    ctx.stroke();
  };

  const drawSideSilhouette = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    facingRight: boolean
  ) => {
    const dir = facingRight ? 1 : -1;
    const cx = x + w / 2;
    const headR = w * 0.08;
    const headY = y + h * 0.1;
    const shoulderY = y + h * 0.22;
    const hipY = y + h * 0.48;
    const kneeY = y + h * 0.68;
    const ankleY = y + h * 0.88;
    const depth = w * 0.12;

    ctx.strokeStyle = GUIDE_STROKE;
    ctx.lineWidth = GUIDE_LINE_WIDTH;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.ellipse(cx + dir * depth * 0.3, headY, headR * 0.75, headR, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, headY + headR);
    ctx.lineTo(cx, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, shoulderY);
    ctx.lineTo(cx + dir * depth, shoulderY + h * 0.02);
    ctx.lineTo(cx + dir * depth * 0.8, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + dir * depth * 0.5, shoulderY);
    ctx.lineTo(cx + dir * (depth + w * 0.06), shoulderY + h * 0.1);
    ctx.lineTo(cx + dir * (depth + w * 0.04), shoulderY + h * 0.18);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + dir * depth * 0.4, hipY);
    ctx.lineTo(cx + dir * w * 0.04, kneeY);
    ctx.lineTo(cx + dir * w * 0.05, ankleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, hipY);
    ctx.lineTo(cx - dir * w * 0.02, kneeY);
    ctx.lineTo(cx - dir * w * 0.03, ankleY);
    ctx.stroke();
  };

  const drawBackSilhouette = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number
  ) => {
    const cx = x + w / 2;
    const headR = w * 0.09;
    const headY = y + h * 0.1;
    const shoulderY = y + h * 0.22;
    const hipY = y + h * 0.48;
    const kneeY = y + h * 0.68;
    const ankleY = y + h * 0.88;
    const shoulderW = w * 0.34;
    const hipW = w * 0.24;
    const armRaise = w * 0.07;

    ctx.strokeStyle = GUIDE_STROKE;
    ctx.lineWidth = GUIDE_LINE_WIDTH;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.arc(cx, headY, headR, Math.PI, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, headY);
    ctx.lineTo(cx, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - shoulderW / 2, shoulderY);
    ctx.lineTo(cx + shoulderW / 2, shoulderY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - hipW / 2, hipY);
    ctx.lineTo(cx + hipW / 2, hipY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - shoulderW / 2, shoulderY);
    ctx.lineTo(cx - shoulderW / 2 - armRaise, shoulderY + h * 0.11);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + shoulderW / 2, shoulderY);
    ctx.lineTo(cx + shoulderW / 2 + armRaise, shoulderY + h * 0.11);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - hipW / 2 + w * 0.03, hipY);
    ctx.lineTo(cx - w * 0.06, kneeY);
    ctx.lineTo(cx - w * 0.07, ankleY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + hipW / 2 - w * 0.03, hipY);
    ctx.lineTo(cx + w * 0.06, kneeY);
    ctx.lineTo(cx + w * 0.07, ankleY);
    ctx.stroke();
  };

  const drawGuideSilhouette = useCallback(
    (ctx: CanvasRenderingContext2D, direction: 0 | 90 | 180 | 270) => {
      const rect = getGuideRect(ctx.canvas);
      const { x, y, width, height } = rect;

      ctx.save();
      drawGuideFrame(ctx, rect);

      if (direction === 0) {
        drawFrontSilhouette(ctx, x, y, width, height);
      } else if (direction === 90) {
        drawSideSilhouette(ctx, x, y, width, height, true);
      } else if (direction === 180) {
        drawBackSilhouette(ctx, x, y, width, height);
      } else {
        drawSideSilhouette(ctx, x, y, width, height, false);
      }

      ctx.restore();
    },
    [getGuideRect]
  );

  const guideDirection = (isComplete
    ? 0
    : currentStep.direction) as 0 | 90 | 180 | 270;

  const drawScene = useCallback(
    (ctx: CanvasRenderingContext2D, _pose: posedetection.Pose | null, showGuide = true) => {
      const canvas = ctx.canvas;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-canvas.width, 0);

      if (videoRef.current) {
        const vw = videoRef.current.videoWidth || CANVAS_W;
        const vh = videoRef.current.videoHeight || CANVAS_H;
        const scale = Math.max(canvas.width / vw, canvas.height / vh);
        const dw = vw * scale;
        const dh = vh * scale;
        const dx = (canvas.width - dw) / 2;
        const dy = (canvas.height - dh) / 2;
        ctx.drawImage(videoRef.current, dx, dy, dw, dh);
      }

      if (showGuide) {
        drawGuideSilhouette(ctx, guideDirection);
      }

      ctx.restore();
    },
    [drawGuideSilhouette, guideDirection]
  );

  useEffect(() => {
    activeRef.current = true;

    const initDetector = async () => {
      await tf.ready();
      if (!activeRef.current) return;
      detectorRef.current = await posedetection.createDetector(
        posedetection.SupportedModels.MoveNet,
        { modelType: posedetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
      );
    };
    initDetector();

    return () => {
      activeRef.current = false;
      detectorRef.current?.dispose?.();
      detectorRef.current = null;
    };
  }, []);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: CANVAS_W },
            height: { ideal: CANVAS_H },
            facingMode: 'user',
          },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current && activeRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(() => {});
          };
        }
      } catch (e) {
        console.error('カメラの起動に失敗しました:', e);
      }
    };
    initCamera();
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    let animationId = 0;
    let running = true;

    const render = async () => {
      if (!running || !activeRef.current) return;

      const video = videoRef.current;
      const detector = detectorRef.current;
      const canvas = canvasRef.current;

      if (detector && video && canvas && isVideoReady(video)) {
        try {
          const poses = await detector.estimatePoses(video, {
            maxPoses: 1,
            flipHorizontal: false,
          });
          if (!running || !activeRef.current) return;
          if (poses.length > 0) {
            latestPoseRef.current = poses[0];
          }
          const ctx = canvas.getContext('2d');
          if (ctx) {
            drawScene(ctx, poses[0] || null);
          }
        } catch (err) {
          console.warn('ポーズ推定をスキップ:', err);
        }
      }

      if (running && activeRef.current) {
        animationId = requestAnimationFrame(render);
      }
    };

    animationId = requestAnimationFrame(render);
    return () => {
      running = false;
      cancelAnimationFrame(animationId);
    };
  }, [drawScene]);

  const performCapture = useCallback(async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!canvas || !video || !detector || !isVideoReady(video)) return;

    let pose: posedetection.Pose | undefined;
    try {
      const poses = await detector.estimatePoses(video, { maxPoses: 1, flipHorizontal: false });
      pose = poses[0];
    } catch (err) {
      console.warn('撮影時ポーズ推定エラー:', err);
      alert('カメラの準備が完了していません。少し待ってから再度お試しください。');
      setIsCountingDown(false);
      setCountdown(null);
      return;
    }
    if (!pose) {
      alert('ポーズが検出できませんでした。ガイド内に全身が入るよう調整してください。');
      setIsCountingDown(false);
      setCountdown(null);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (ctx) drawScene(ctx, pose, false);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const metrics = computeCaptureMetrics(pose.keypoints, currentStep.direction);

    if (currentStep.direction === 0 && video) {
      const skin = sampleSkinFromVideo(video, pose.keypoints);
      console.log('🎨 肌色サンプル (RGB):', skin);
      if (skin.length > 0) {
        skinSamplesRef.current = skin;
      }
    }

    console.log(`📐 撮影メトリクス [${currentStep.label}]:`, metrics);

    const canvasKeypoints = mapKeypointsToCanvas(
      pose.keypoints,
      video.videoWidth,
      video.videoHeight,
      canvas.width,
      canvas.height,
      true
    );

    const capture: CaptureData = {
      direction: currentStep.direction,
      directionLabel: currentStep.label,
      keypoints: canvasKeypoints.map((kp) => ({
        name: kp.name,
        x: kp.x,
        y: kp.y,
        score: kp.score,
      })),
      imageDataUrl,
      metrics,
    };

    setPreviewUrl(imageDataUrl);
    setCaptures((prev) => [...prev, capture]);

    setTimeout(() => {
      setPreviewUrl(null);
      setStepIndex((prev) => Math.min(prev + 1, 3));
      setIsCountingDown(false);
      setCountdown(null);
    }, 2000);
  }, [currentStep, drawScene]);

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0) {
      setFlash(true);
      setTimeout(() => setFlash(false), 200);
      performCapture();
    }
  }, [countdown, performCapture]);

  useEffect(() => {
    if (captures.length === 4 && !hasSubmittedRef.current) {
      hasSubmittedRef.current = true;
      const aggregatedMetrics = aggregateMetrics(captures);
      const height = estimateBodyHeightCm(captures);
      const weight = estimateWeightKg(height, aggregatedMetrics);

      const payload: ScanPayload = {
        height,
        weight,
        captures,
        aggregatedMetrics,
        skinSamples: skinSamplesRef.current,
      };

      console.log('📤 診断送信ペイロード:', {
        height,
        weight,
        aggregatedMetrics,
        skinSamples: skinSamplesRef.current,
        captureSummary: captures.map((c) => ({
          direction: c.directionLabel,
          metrics: c.metrics,
        })),
      });

      onDiagnosisComplete(payload);
    }
  }, [captures, onDiagnosisComplete]);

  const startCountdown = () => {
    if (isCountingDown || isComplete || isAnalyzing) return;
    setIsCountingDown(true);
    setCountdown(3);
  };

  return (
    <div className="pose-estimation">
      <div className="pose-overlay pose-overlay--top">
        <div className="step-indicator">
          {DIRECTION_STEPS.map((step, i) => (
            <span
              key={step.direction}
              className={`step-dot ${i < captures.length ? 'done' : ''} ${i === stepIndex && !isComplete ? 'active' : ''}`}
            >
              {step.label}
            </span>
          ))}
        </div>
        <h2 className="direction-title">
          {isComplete ? '撮影完了' : `ステップ ${stepIndex + 1}/4：${currentStep.label}`}
        </h2>
        <p className="direction-hint">{currentStep.turnHint}</p>
        <p className="pose-instruction">
          足を広げ、腕を少し浮かせて立ってください（Aポーズ）
        </p>
      </div>

      <video ref={videoRef} className="pose-video-hidden" playsInline muted />
      <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="pose-canvas" />

      {countdown !== null && countdown > 0 && (
        <div className="countdown-overlay">
          <span className="countdown-number">{countdown}</span>
        </div>
      )}

      {flash && <div className="flash-overlay" />}

      {previewUrl && (
        <div className="capture-preview">
          <img src={previewUrl} alt="撮影プレビュー" />
          <span>撮影完了</span>
        </div>
      )}

      {!isComplete && (
        <div className="pose-overlay pose-overlay--bottom">
          <button
            className="capture-button pop-btn pop-btn--pink"
            onClick={startCountdown}
            disabled={isCountingDown || isAnalyzing}
          >
            {isCountingDown
              ? '撮影中...'
              : `${currentStep.label}を撮影 (${captures.length + 1}/4)`}
          </button>
        </div>
      )}

      {isAnalyzing && (
        <div className="analyzing-overlay">
          <div className="analyzing-spinner" />
          <p>AI診断中...</p>
        </div>
      )}
    </div>
  );
};
