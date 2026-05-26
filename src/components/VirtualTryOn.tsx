import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CaptureData } from './PoseEstimation';
import type { DiagnosisData } from './DiagnosisResult';
import { renderSuitComposite } from '../services/suitRenderer';
import { clearSuitTextureCache } from '../services/suitTextureLoader';
import {
  MOCK_SUITS,
  resolveSuitForTryOn,
  getCompositeKey,
  type SelectedTryOnConfig,
} from '../data/mockSuits';
import {
  AVAILABLE_SUIT_SIZES,
  resolveRecommendedSize,
  type SuitSizeCode,
} from '../data/suitSizes';
import {
  LightingControl,
  BACKGROUND_PRESETS,
  LIGHTING_PRESETS,
  type BackgroundId,
  type LightingId,
} from './LightingControl';
import './VirtualTryOn.css';

const DIRECTIONS: Array<0 | 90 | 180 | 270> = [0, 90, 180, 270];
const DIRECTION_LABELS: Record<number, string> = {
  0: '正面',
  90: '右側',
  180: '後ろ',
  270: '左側',
};

interface VirtualTryOnProps {
  captures: CaptureData[];
  diagnosis: DiagnosisData;
  tryOnConfig: SelectedTryOnConfig;
  onExit: () => void;
  onBackToResult: () => void;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function angleToDirection(angle: number): 0 | 90 | 180 | 270 {
  const normalized = ((angle % 360) + 360) % 360;
  if (normalized < 45 || normalized >= 315) return 0;
  if (normalized < 135) return 90;
  if (normalized < 225) return 180;
  return 270;
}

export const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
  captures,
  diagnosis,
  tryOnConfig,
  onExit,
  onBackToResult,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositeCacheRef = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const dragRef = useRef<{ startX: number; startAngle: number } | null>(null);

  const [rotationAngle, setRotationAngle] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<SelectedTryOnConfig>(tryOnConfig);
  const [background, setBackground] = useState<BackgroundId>('office');
  const [lighting, setLighting] = useState<LightingId>('fluorescent');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompositing, setIsCompositing] = useState(true);
  const [renderTick, setRenderTick] = useState(0);
  const recommendedSize = useMemo(() => resolveRecommendedSize(diagnosis), [diagnosis]);
  const [selectedSize, setSelectedSize] = useState<SuitSizeCode>(recommendedSize);

  useEffect(() => {
    setSelectedSize(recommendedSize);
  }, [recommendedSize]);

  const selectedSuit = useMemo(
    () => resolveSuitForTryOn(selectedConfig),
    [selectedConfig]
  );

  const currentSuitBase = MOCK_SUITS.find((s) => s.id === selectedConfig.suitId);

  const buildCompositeKey = useCallback(
    (direction: number, config: SelectedTryOnConfig) =>
      getCompositeKey(config.suitId, config.colorId, direction),
    []
  );

  const renderComposite = useCallback(
    async (direction: 0 | 90 | 180 | 270, config: SelectedTryOnConfig) => {
      const key = buildCompositeKey(direction, config);
      if (compositeCacheRef.current.has(key)) return;

      const capture = captures.find((c) => c.direction === direction);
      if (!capture?.imageDataUrl) return;

      const suit = resolveSuitForTryOn(config);
      const photo = await loadImage(capture.imageDataUrl);
      const offscreen = document.createElement('canvas');
      offscreen.width = 720;
      offscreen.height = 1280;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return;

      await renderSuitComposite(
        ctx,
        photo,
        direction,
        capture.keypoints,
        suit,
        diagnosis.bodyType,
        diagnosis.suitSize.sleeveLengthCm
      );

      compositeCacheRef.current.set(key, offscreen);
      setRenderTick((t) => t + 1);
    },
    [buildCompositeKey, captures, diagnosis]
  );

  useEffect(() => {
    setSelectedConfig(tryOnConfig);
  }, [tryOnConfig]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsCompositing(true);
      compositeCacheRef.current.clear();
      clearSuitTextureCache();

      await Promise.all(DIRECTIONS.map((d) => renderComposite(d, selectedConfig)));

      if (!cancelled) setIsCompositing(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [selectedConfig, captures, renderComposite]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dirA = angleToDirection(rotationAngle);
    const dirB = angleToDirection(rotationAngle + 45);
    const t = (rotationAngle % 90) / 90;

    const keyA = buildCompositeKey(dirA, selectedConfig);
    const keyB = buildCompositeKey(dirB, selectedConfig);
    const imgA = compositeCacheRef.current.get(keyA);
    const imgB = compositeCacheRef.current.get(keyB);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (imgA && imgB && dirA !== dirB) {
      ctx.globalAlpha = 1 - t;
      ctx.drawImage(imgA, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = t;
      ctx.drawImage(imgB, 0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
    } else if (imgA) {
      ctx.drawImage(imgA, 0, 0, canvas.width, canvas.height);
    }
  }, [rotationAngle, selectedConfig, renderTick, buildCompositeKey]);

  const lightingStyle = LIGHTING_PRESETS[lighting];
  const bgStyle = BACKGROUND_PRESETS[background];

  return (
    <div className="virtual-tryon">
      <header className="tryon-header">
        <p className="tryon-brand">✨ VIRTUAL SUIT ✨</p>
        <h1>バーチャル試着</h1>
        <p className="tryon-sub">TPO・照明を切り替えて360°確認！</p>
      </header>

      <div className="tryon-layout">
        <div
          className="tryon-viewer-wrap"
          style={{
            backgroundImage: `url(${bgStyle.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#e8e8e8',
          }}
        >
          <canvas
            ref={canvasRef}
            width={720}
            height={1280}
            className={`tryon-canvas ${isDragging ? 'dragging' : ''}`}
            onPointerDown={(e) => {
              dragRef.current = { startX: e.clientX, startAngle: rotationAngle };
              setIsDragging(true);
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!dragRef.current) return;
              setRotationAngle(dragRef.current.startAngle + (e.clientX - dragRef.current.startX) * 0.5);
            }}
            onPointerUp={() => {
              if (!dragRef.current) return;
              setRotationAngle(Math.round(rotationAngle / 90) * 90);
              dragRef.current = null;
              setIsDragging(false);
            }}
            onPointerLeave={() => {
              if (!dragRef.current) return;
              setRotationAngle(Math.round(rotationAngle / 90) * 90);
              dragRef.current = null;
              setIsDragging(false);
            }}
          />
          <div
            className="lighting-overlay"
            style={{
              background: lightingStyle.overlay,
              mixBlendMode: lightingStyle.blendMode,
            }}
          />
          {isCompositing && (
            <div className="tryon-loading" aria-live="polite">
              スーツを合成しています…
            </div>
          )}
          <div className="rotation-badge">{DIRECTION_LABELS[angleToDirection(rotationAngle)]}</div>
          <div className="rotation-dots">
            {DIRECTIONS.map((d) => (
              <button
                key={d}
                type="button"
                className={`rot-dot ${angleToDirection(rotationAngle) === d ? 'active' : ''}`}
                onClick={() => setRotationAngle(d)}
              >
                {DIRECTION_LABELS[d]}
              </button>
            ))}
          </div>
        </div>

        <aside className="tryon-sidebar">
          <div className="suit-info-card">
            <p className="sidebar-label">SELECTED SUIT</p>
            <h2>{selectedSuit.name}</h2>
            <div className="color-swatch" style={{ background: selectedSuit.colorHex }} />
            <dl className="suit-specs">
              <div><dt>カラー</dt><dd>{selectedSuit.colorName}</dd></div>
              <div><dt>サイズ</dt><dd>{selectedSize}</dd></div>
              <div><dt>似合い度</dt><dd>{selectedSuit.matchBase}%</dd></div>
              <div><dt>体型</dt><dd>{diagnosis.bodyType}</dd></div>
            </dl>
          </div>

          <LightingControl
            background={background}
            lighting={lighting}
            onBackgroundChange={setBackground}
            onLightingChange={setLighting}
          />

          {currentSuitBase && (
            <div className="tryon-color-picker">
              <p className="sidebar-label">🎨 カラー選択</p>
              <div className="tryon-color-options">
                {currentSuitBase.colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`tryon-color-btn ${selectedConfig.colorId === c.id ? 'active' : ''}`}
                    onClick={() =>
                      setSelectedConfig((prev) => ({ ...prev, colorId: c.id }))
                    }
                    title={c.name}
                  >
                    <span className="tryon-color-dot" style={{ background: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="tryon-size-picker">
            <p className="sidebar-label">📏 サイズ選択</p>
            <p className="tryon-size-hint">
              おすすめ：<strong>{recommendedSize}</strong>
            </p>
            <div className="tryon-size-grid">
              {AVAILABLE_SUIT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  className={`tryon-size-btn ${selectedSize === size ? 'active' : ''} ${recommendedSize === size ? 'recommended' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                  {recommendedSize === size && (
                    <span className="size-recommend-badge">おすすめ</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="tryon-nav-buttons">
            <button type="button" className="pop-btn pop-btn--outline tryon-nav-btn" onClick={onBackToResult}>
              診断結果に戻る
            </button>
            <button type="button" className="pop-btn pop-btn--pink tryon-nav-btn" onClick={onExit}>
              試着を終了
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
