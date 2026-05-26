import React, { useState } from 'react';
import './DiagnosisResult.css';
import { getColorInfo, getSkeletonInfo } from './diagnosisLabels';
import { ImpressionAnalysis } from './ImpressionAnalysis';
import { SceneAppropriations } from './SceneAppropriations';
import {
  MOCK_SUITS,
  getMockSuitById,
  type SelectedTryOnConfig,
} from '../data/mockSuits';

function normalizeSuitId(id: string): string {
  if (MOCK_SUITS.some((s) => s.id === id)) return id;
  const num = parseInt(id.replace(/\D/g, ''), 10);
  if (!Number.isNaN(num) && num > 0) {
    return MOCK_SUITS[(num - 1) % MOCK_SUITS.length].id;
  }
  return MOCK_SUITS[0].id;
}
import { getTopImpressionLabels, getTopScenes } from '../data/suitAnalysisData';

export interface DiagnosisData {
  skeleton: string;
  bodyType: string;
  personalColor: {
    colorType: string;
    recommendedColors: string[];
  };
  suitSize: {
    jacketSize: string;
    sleeveLengthCm: number;
    hemLengthCm: number;
    fit: string;
  };
  recommendedSuits: Array<{
    id: string;
    name: string;
    color: string;
    imageUrl: string;
    matchPercentage: number;
  }>;
}

export function isValidDiagnosisData(value: unknown): value is DiagnosisData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as DiagnosisData;
  return (
    typeof data.skeleton === 'string' &&
    typeof data.bodyType === 'string' &&
    data.personalColor != null &&
    typeof data.personalColor.colorType === 'string' &&
    Array.isArray(data.personalColor.recommendedColors) &&
    data.suitSize != null &&
    typeof data.suitSize.jacketSize === 'string' &&
    typeof data.suitSize.sleeveLengthCm === 'number' &&
    typeof data.suitSize.hemLengthCm === 'number' &&
    typeof data.suitSize.fit === 'string' &&
    Array.isArray(data.recommendedSuits)
  );
}

function SuitPickerCard({
  suitId,
  matchPercent,
  selected,
  selectedColorId,
  onSelect,
  onColorSelect,
  onTryOn,
}: {
  suitId: string;
  matchPercent: number;
  selected: boolean;
  selectedColorId: string;
  onSelect: () => void;
  onColorSelect: (colorId: string) => void;
  onTryOn: () => void;
}) {
  const suit = getMockSuitById(suitId);
  const impressions = getTopImpressionLabels(suitId, 2);
  const scenes = getTopScenes(suitId, 2);

  return (
    <div className={`inventory-suit-card ${selected ? 'selected' : ''}`}>
      <button type="button" className="inventory-suit-main" onClick={onSelect}>
        <div className="inventory-suit-thumb">
          <img src={suit.textures.sheet} alt={suit.name} />
        </div>
        <div className="inventory-suit-meta">
          <h3>{suit.name}</h3>
          <p className="match-line">似合い度 {matchPercent}%</p>
          <p className="impression-line">
            印象：{impressions.join('・')}
          </p>
          <p className="scene-line">
            適正シーン：{scenes.join('・')}
          </p>
        </div>
      </button>

      {selected && (
        <div className="inventory-suit-detail">
          <div className="color-picker">
            <p className="color-picker-label">カラーバリエーション</p>
            <div className="color-options">
              {suit.colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`color-option ${selectedColorId === c.id ? 'active' : ''}`}
                  onClick={() => onColorSelect(c.id)}
                  title={c.name}
                >
                  <span className="color-dot" style={{ background: c.hex }} />
                  <span>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
          <ImpressionAnalysis clothId={suitId} />
          <SceneAppropriations clothId={suitId} />
          <button type="button" className="pop-btn pop-btn--pink tryon-btn" onClick={onTryOn}>
            このスーツで試着する ✨
          </button>
        </div>
      )}
    </div>
  );
}

export const DiagnosisResult: React.FC<{
  data: DiagnosisData;
  onStartVirtualTryOn: (config: SelectedTryOnConfig) => void;
  onSkip?: () => void;
}> = ({ data, onStartVirtualTryOn, onSkip }) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedSuitId, setSelectedSuitId] = useState(
    data.recommendedSuits[0]?.id || MOCK_SUITS[0].id
  );
  const [selectedColorId, setSelectedColorId] = useState(
    getMockSuitById(selectedSuitId).colors[0].id
  );

  const skeletonInfo = getSkeletonInfo(data.skeleton);
  const colorInfo = getColorInfo(data.personalColor.colorType);

  const handleSelectSuit = (suitId: string) => {
    setSelectedSuitId(suitId);
    setSelectedColorId(getMockSuitById(suitId).colors[0].id);
  };

  const getMatchPercent = (suitId: string, fallback: number) => {
    const rec = data.recommendedSuits.find((s) => s.id === suitId);
    return rec?.matchPercentage ?? fallback;
  };

  return (
    <div className="diagnosis-result">
      <div className="result-header">
        <p className="result-eyebrow">AI DIAGNOSIS REPORT</p>
        <h1>あなたの診断結果</h1>
        <p className="subtitle">似合い度%を参考に、失敗しないスーツ選びを</p>
      </div>

      <div className="result-cards">
        {(['skeleton', 'body', 'color', 'size'] as const).map((section) => {
          const labels: Record<string, { title: string; value: string }> = {
            skeleton: { title: '骨格', value: skeletonInfo.label },
            body: { title: '体型', value: data.bodyType },
            color: { title: 'パーソナルカラー', value: colorInfo.label },
            size: { title: '推奨サイズ', value: data.suitSize.jacketSize },
          };
          return (
            <div
              key={section}
              className={`result-card ${expandedSection === section ? 'expanded' : ''}`}
              onClick={() => setExpandedSection(expandedSection === section ? null : section)}
            >
              <div className="card-header">
                <span className="card-title">{labels[section].title}</span>
                <span className="card-value">{labels[section].value}</span>
              </div>
              {expandedSection === section && section === 'size' && (
                <div className="card-details">
                  <p>袖丈: <strong>{data.suitSize.sleeveLengthCm} cm</strong></p>
                  <p>裾丈: <strong>{data.suitSize.hemLengthCm} cm</strong></p>
                  <p className="fit-advice">{data.suitSize.fit}がよく見えます</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="recommended-suits-section">
        <h2>あなたへのおすすめ</h2>
        <div className="inventory-list">
          {data.recommendedSuits.map((rec) => {
            const suitId = normalizeSuitId(rec.id);
            return (
            <SuitPickerCard
              key={rec.id}
              suitId={suitId}
              matchPercent={rec.matchPercentage}
              selected={selectedSuitId === suitId}
              selectedColorId={selectedColorId}
              onSelect={() => handleSelectSuit(suitId)}
              onColorSelect={setSelectedColorId}
              onTryOn={() =>
                onStartVirtualTryOn({ suitId, colorId: selectedColorId })
              }
            />
            );
          })}
        </div>

        <div className="qr-transfer-section">
          <button
            type="button"
            className="pop-btn pop-btn--green qr-transfer-btn"
            onClick={() => setShowQrModal(true)}
          >
            📱 スマホでバーチャル試着・結果を転送
          </button>
        </div>
      </section>

      {showQrModal && (
        <div className="qr-modal-overlay" onClick={() => setShowQrModal(false)}>
          <div className="qr-modal" onClick={(e) => e.stopPropagation()}>
            <h3>診断結果をスマホで確認</h3>
            <p className="qr-modal-message">
              スマホからも、お好きなスーツを選んで何度でもバーチャル試着を楽しめます。
              自分にぴったりの一着をじっくり見つけてくださいね！
            </p>
            <div className="qr-code-mock" aria-hidden="true">
              {Array.from({ length: 64 }).map((_, i) => (
                <span key={i} className={(i * 7 + 3) % 5 < 2 ? 'qr-on' : 'qr-off'} />
              ))}
            </div>
            <p className="qr-modal-desc">QRコードをスマホで読み取ってください（デモ）</p>
            <p className="qr-modal-url">https://suit-signage.demo/result/mock</p>
            <button
              type="button"
              className="pop-btn pop-btn--pink"
              onClick={() => setShowQrModal(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <section className="store-inventory-section">
        <h2>店舗在庫スーツ一覧</h2>
        <div className="inventory-list">
          {MOCK_SUITS.filter((s) => s.inStock).map((suit) => (
            <SuitPickerCard
              key={suit.id}
              suitId={suit.id}
              matchPercent={getMatchPercent(suit.id, suit.matchBase)}
              selected={selectedSuitId === suit.id}
              selectedColorId={selectedSuitId === suit.id ? selectedColorId : suit.colors[0].id}
              onSelect={() => handleSelectSuit(suit.id)}
              onColorSelect={setSelectedColorId}
              onTryOn={() =>
                onStartVirtualTryOn({ suitId: suit.id, colorId: selectedColorId })
              }
            />
          ))}
        </div>
      </section>

      <div className="action-buttons">
        <button
          type="button"
          className="pop-btn pop-btn--pink"
          onClick={() => onStartVirtualTryOn({ suitId: selectedSuitId, colorId: selectedColorId })}
        >
          選択中のスーツで試着する
        </button>
        <button type="button" className="pop-btn pop-btn--outline" onClick={onSkip}>
          最初からやり直す
        </button>
      </div>
    </div>
  );
};
