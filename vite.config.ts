import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: [
      {
        find: '@mediapipe/pose/pose.js',
        replacement: path.resolve(__dirname, 'node_modules/@mediapipe/pose/pose.js'),
      },
      {
        find: '@mediapipe/pose',
        replacement: path.resolve(__dirname, 'src/shims/mediapipe-pose.ts'),
      },
    ],
  },
  optimizeDeps: {
    include: [
      '@tensorflow/tfjs',
      '@tensorflow/tfjs-backend-webgl',
      '@tensorflow-models/pose-detection',
    ],
    exclude: ['@mediapipe/pose'],
  },
  build: {
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
