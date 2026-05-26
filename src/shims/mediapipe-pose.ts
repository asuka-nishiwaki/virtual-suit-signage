/**
 * Vite 向け @mediapipe/pose シム
 */
import '../../node_modules/@mediapipe/pose/pose.js';

type PoseConstructor = new (config?: Record<string, unknown>) => {
  initialize: () => Promise<void>;
  send: (input: HTMLVideoElement | HTMLCanvasElement) => Promise<void>;
  onResults: (callback: (results: unknown) => void) => void;
  close: () => Promise<void>;
  setOptions: (options: Record<string, unknown>) => void;
};

const globalScope = globalThis as typeof globalThis & { Pose?: PoseConstructor };

if (!globalScope.Pose) {
  throw new Error('@mediapipe/pose: Pose が global に見つかりません');
}

export const Pose = globalScope.Pose;
export default Pose;
