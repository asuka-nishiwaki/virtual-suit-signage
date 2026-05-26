import React from 'react';
import { SUIT_SCENES } from '../data/suitAnalysisData';
import './SceneAppropriations.css';

export const SceneAppropriations: React.FC<{ clothId: string }> = ({ clothId }) => {
  const scenes = SUIT_SCENES[clothId] ?? [];

  const getSuitabilityColor = (suitability: string) => {
    switch (suitability) {
      case '◎':
        return '#00cc44';
      case '○':
        return '#ffaa00';
      case '△':
        return '#ff6666';
      default:
        return '#cccccc';
    }
  };

  if (scenes.length === 0) return null;

  return (
    <div className="scene-appropriations">
      <h4>シーン適正</h4>
      <div className="scene-list">
        {scenes.map((scene) => (
          <div key={scene.scene} className="scene-item">
            <div className="scene-header">
              <span className="scene-name">{scene.scene}</span>
              <span
                className="suitability-badge"
                style={{ backgroundColor: getSuitabilityColor(scene.suitability) }}
              >
                {scene.suitability}
              </span>
            </div>
            <div className="scene-bar">
              <div
                className="scene-bar-fill"
                style={{
                  width: `${scene.percentage}%`,
                  backgroundColor: getSuitabilityColor(scene.suitability),
                }}
              />
            </div>
            <p className="scene-description">{scene.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
