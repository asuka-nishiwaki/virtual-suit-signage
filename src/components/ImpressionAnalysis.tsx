import React from 'react';
import { SUIT_IMPRESSIONS, IMPRESSION_LABELS } from '../data/suitAnalysisData';
import type { ImpressionScore } from '../data/suitAnalysisData';
import './ImpressionAnalysis.css';

export const ImpressionAnalysis: React.FC<{ clothId: string }> = ({ clothId }) => {
  const impressions: ImpressionScore | undefined = SUIT_IMPRESSIONS[clothId];

  if (!impressions) return null;

  const topTwo = Object.entries(impressions)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([key]) => IMPRESSION_LABELS[key as keyof ImpressionScore]);

  return (
    <div className="impression-analysis">
      <h4>印象診断</h4>
      <div className="impression-tags">
        {topTwo.map((label) => (
          <span key={label} className="impression-tag">
            {label}
          </span>
        ))}
      </div>
      <div className="impression-chart">
        {Object.entries(IMPRESSION_LABELS).map(([key, label]) => (
          <div key={key} className="impression-item">
            <label>{label}</label>
            <div className="bar-container">
              <div
                className="bar-fill"
                style={{ width: `${impressions[key as keyof ImpressionScore] * 100}%` }}
              />
            </div>
            <span className="percentage">
              {Math.round(impressions[key as keyof ImpressionScore] * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
