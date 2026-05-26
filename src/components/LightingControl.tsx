import React from 'react';
import './LightingControl.css';

export type BackgroundId = 'outdoor' | 'office' | 'hotel' | 'meeting';
export type LightingId = 'fluorescent' | 'warm' | 'sunlight';

export const BACKGROUND_PRESETS: Record<
  BackgroundId,
  { label: string; imageUrl: string; fallback: string }
> = {
  outdoor: {
    label: '屋外（ビル街）',
    imageUrl: '/assets/backgrounds/outdoor.jpg',
    fallback: 'linear-gradient(180deg, #87ceeb 0%, #708090 100%)',
  },
  office: {
    label: 'オフィス',
    imageUrl: '/assets/backgrounds/office.jpg',
    fallback: 'linear-gradient(180deg, #e8e8e8 0%, #a0a0a0 100%)',
  },
  hotel: {
    label: 'ホテルロビー',
    imageUrl: '/assets/backgrounds/hotel.jpg',
    fallback: 'linear-gradient(180deg, #4a4035 0%, #1a1612 100%)',
  },
  meeting: {
    label: '会議室',
    imageUrl: '/assets/backgrounds/meeting.jpg',
    fallback: 'linear-gradient(180deg, #f0f4f8 0%, #b8c5d0 100%)',
  },
};

export const LIGHTING_PRESETS: Record<
  LightingId,
  { label: string; overlay: string; blendMode: React.CSSProperties['mixBlendMode'] }
> = {
  fluorescent: {
    label: '蛍光灯（白）',
    overlay: 'rgba(255, 255, 255, 0.18)',
    blendMode: 'soft-light',
  },
  warm: {
    label: '暖色灯（オレンジ）',
    overlay: 'rgba(255, 140, 50, 0.28)',
    blendMode: 'multiply',
  },
  sunlight: {
    label: '太陽光',
    overlay: 'rgba(255, 230, 100, 0.22)',
    blendMode: 'overlay',
  },
};

interface LightingControlProps {
  background: BackgroundId;
  lighting: LightingId;
  onBackgroundChange: (id: BackgroundId) => void;
  onLightingChange: (id: LightingId) => void;
}

export const LightingControl: React.FC<LightingControlProps> = ({
  background,
  lighting,
  onBackgroundChange,
  onLightingChange,
}) => {
  return (
    <div className="lighting-control">
      <h3>🎨 TPO・照明設定</h3>

      <div className="control-group">
        <p className="control-label">背景</p>
        <div className="control-buttons bg-thumbnails">
          {(Object.entries(BACKGROUND_PRESETS) as [BackgroundId, typeof BACKGROUND_PRESETS.outdoor][]).map(
            ([id, preset]) => (
              <button
                key={id}
                type="button"
                className={`control-btn bg-thumb ${background === id ? 'active' : ''}`}
                onClick={() => onBackgroundChange(id)}
              >
                <span
                  className="bg-thumb-image"
                  style={{ backgroundImage: `url(${preset.imageUrl})` }}
                />
                <span className="bg-thumb-label">{preset.label}</span>
              </button>
            )
          )}
        </div>
      </div>

      <div className="control-group">
        <p className="control-label">照明フィルター</p>
        <div className="control-buttons">
          {(Object.entries(LIGHTING_PRESETS) as [LightingId, typeof LIGHTING_PRESETS.fluorescent][]).map(
            ([id, preset]) => (
              <button
                key={id}
                type="button"
                className={`control-btn lighting-btn ${lighting === id ? 'active' : ''}`}
                onClick={() => onLightingChange(id)}
              >
                {preset.label}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
};
