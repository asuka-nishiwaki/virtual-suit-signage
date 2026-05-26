import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { ScanPayload, CaptureData } from './components/PoseEstimation';

const PoseEstimation = lazy(() =>
  import('./components/PoseEstimation').then((module) => ({
    default: module.PoseEstimation,
  })),
);
import {
  DiagnosisResult,
  isValidDiagnosisData,
} from './components/DiagnosisResult';
import type { DiagnosisData } from './components/DiagnosisResult';
import { VirtualTryOn } from './components/VirtualTryOn';
import { StartScreen } from './components/StartScreen';
import { EndScreen } from './components/EndScreen';
import { buildMockDiagnosis } from './services/mockDiagnosis';
import type { SelectedTryOnConfig } from './data/mockSuits';
import './App.css';

type AppView = 'start' | 'scan' | 'result' | 'tryon' | 'end';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

function App() {
  const [view, setView] = useState<AppView>('start');
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [capturesWithImages, setCapturesWithImages] = useState<CaptureData[]>([]);
  const [tryOnConfig, setTryOnConfig] = useState<SelectedTryOnConfig>({
    suitId: 'suit-001',
    colorId: 'c1',
  });
  const [loading, setLoading] = useState(false);
  const [scanKey, setScanKey] = useState(0);

  useEffect(() => {
    if (diagnosis && !isValidDiagnosisData(diagnosis)) {
      setDiagnosis(null);
    }
  }, [diagnosis]);

  const handleDiagnose = useCallback(async (scanPayload: ScanPayload) => {
    setCapturesWithImages(scanPayload.captures);
    setLoading(true);

    try {
      const apiPayload = {
        ...scanPayload,
        captures: scanPayload.captures.map(({ imageDataUrl, ...rest }) => rest),
      };

      let result: DiagnosisData | null = null;

      try {
        const response = await fetch(`${API_BASE}/api/diagnose`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(apiPayload),
        });

        if (response.ok) {
          const data = await response.json();
          if (isValidDiagnosisData(data.result)) {
            result = data.result;
          }
        }
      } catch {
        // 静的ホスティング等で API 未接続
      }

      if (!result) {
        result = buildMockDiagnosis(scanPayload);
      }

      setDiagnosis(result);
      setView('result');
    } catch (err) {
      console.error('診断エラー:', err);
      alert('診断処理中にエラーが発生しました。もう一度お試しください。');
      setScanKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStartVirtualTryOn = (config: SelectedTryOnConfig) => {
    if (capturesWithImages.length < 4) {
      alert('撮影データがありません。再度スキャンしてください。');
      return;
    }
    setTryOnConfig(config);
    setView('tryon');
  };

  const handleExitTryOn = () => setView('end');

  const handleRestart = () => {
    setDiagnosis(null);
    setCapturesWithImages([]);
    setView('start');
    setScanKey((k) => k + 1);
  };

  return (
    <div className="App">
      {view === 'start' && <StartScreen onStart={() => setView('scan')} />}

      {view === 'scan' && (
        <>
          <header className="app-header">
            <p className="app-brand">VIRTUAL SUIT SIGNAGE</p>
            <h1>バーチャルスーツサイネージ</h1>
            <p className="app-subtitle">客観的バーチャル試着体験：絶対にスーツ選びに失敗しない</p>
          </header>
          <div className="camera-section">
            <Suspense fallback={<p className="scan-loading">カメラを準備しています…</p>}>
              <PoseEstimation
                key={scanKey}
                onDiagnosisComplete={handleDiagnose}
                isAnalyzing={loading}
              />
            </Suspense>
          </div>
        </>
      )}

      {view === 'result' && diagnosis && (
        <DiagnosisResult
          data={diagnosis}
          onStartVirtualTryOn={handleStartVirtualTryOn}
          onSkip={handleRestart}
        />
      )}

      {view === 'tryon' && diagnosis && capturesWithImages.length >= 4 && (
        <VirtualTryOn
          captures={capturesWithImages}
          diagnosis={diagnosis}
          tryOnConfig={tryOnConfig}
          onExit={handleExitTryOn}
          onBackToResult={() => setView('result')}
        />
      )}

      {view === 'end' && (
        <EndScreen
          onRestart={handleRestart}
          onBackToResult={() => setView('result')}
        />
      )}
    </div>
  );
}

export default App;
