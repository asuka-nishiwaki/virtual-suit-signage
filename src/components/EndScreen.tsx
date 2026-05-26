import React from 'react';
import './EndScreen.css';

interface EndScreenProps {
  onRestart: () => void;
  onBackToResult: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ onRestart, onBackToResult }) => {
  return (
    <div className="end-screen">
      <div className="end-content">
        <div className="end-sparkles" aria-hidden="true">
          ✨ 🎀 ✨
        </div>
        <h1 className="end-title">ご試着ありがとうございました！</h1>
        <p className="end-message">素敵なスーツが見つかりますように。</p>
        <div className="end-hearts" aria-hidden="true">
          💗 💚 💗
        </div>
        <div className="end-actions">
          <button type="button" className="pop-btn pop-btn--pink end-btn" onClick={onRestart}>
            最初から体験する
          </button>
          <button type="button" className="pop-btn pop-btn--outline end-btn" onClick={onBackToResult}>
            診断結果に戻る
          </button>
        </div>
      </div>
    </div>
  );
};
