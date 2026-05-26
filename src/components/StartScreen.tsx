import React from 'react';
import './StartScreen.css';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="start-screen">
      <div className="start-content">
        <p className="start-brand">VIRTUAL SUIT SIGNAGE</p>
        <h1 className="start-title">バーチャルスーツサイネージ</h1>
        <p className="start-subtitle">
          360°バーチャル試着体験　スムーズに試着し、納得できるスーツ選びを。
        </p>
        <p className="start-desc">
          4方向撮影 → AI体型診断 → TPO別バーチャル試着。
          <br />
          印象・シーン適正を確認しながら、失敗しないスーツ選びを。
        </p>
        <button type="button" className="start-btn pop-btn pop-btn--pink" onClick={onStart}>
          体験を開始する ✨
        </button>
      </div>
    </div>
  );
};
