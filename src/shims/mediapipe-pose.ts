/**
 * Vite / 本番ビルド向け @mediapipe/pose スタブ
 *
 * pose-detection は ESM 先頭で @mediapipe/pose を import するが、
 * 本アプリは MoveNet のみ使用し BlazePose(mediapipe) は使わない。
 * 元の pose.js は Vite バンドル後に globalThis.Pose を登録できず起動時例外になるため、
 * 未使用の Pose コンストラクタを提供する。
 */
type PoseInstance = {
  initialize: () => Promise<void>;
  send: (input: Record<string, unknown>, timestamp?: number) => Promise<void>;
  onResults: (callback: (results: unknown) => void) => void;
  close: () => Promise<void>;
  reset: () => void;
  setOptions: (options: Record<string, unknown>) => void;
};

type PoseConstructor = new (config?: Record<string, unknown>) => PoseInstance;

class PoseStub implements PoseInstance {
  constructor(_config?: Record<string, unknown>) {}

  initialize() {
    return Promise.resolve();
  }

  send() {
    return Promise.resolve();
  }

  onResults(_callback: (results: unknown) => void) {}

  close() {
    return Promise.resolve();
  }

  reset() {}

  setOptions(_options: Record<string, unknown>) {}
}

export const Pose = PoseStub as unknown as PoseConstructor;
export default Pose;
