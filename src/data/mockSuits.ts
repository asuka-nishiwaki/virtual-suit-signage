import { assetUrl } from '../utils/assetUrl';

export interface SuitColorVariant {
  id: string;
  name: string;
  hex: string;
  tintHex?: string | null;
}

export interface SpriteDirectionMap {
  col: number;
  flipH?: boolean;
}

export interface SuitTextures {
  sheet: string;
  sheetCols: number;
  tintHex?: string | null;
  directions?: Partial<Record<0 | 90 | 180 | 270, SpriteDirectionMap>>;
}

export interface MockSuit {
  id: string;
  name: string;
  colorName: string;
  colorHex: string;
  pattern: 'solid' | 'pinstripe' | 'herringbone';
  style: 'slim' | 'regular' | 'classic';
  matchBase: number;
  description: string;
  textures: SuitTextures;
  colors: SuitColorVariant[];
  inStock: boolean;
}

export interface SelectedTryOnConfig {
  suitId: string;
  colorId: string;
}

export const MOCK_SUITS: MockSuit[] = [
  {
    id: 'suit-001',
    name: 'ウールブレンド 2ボタン',
    colorName: 'ライトグレー',
    colorHex: '#b8bcc4',
    pattern: 'solid',
    style: 'slim',
    matchBase: 96,
    description: '柔らかなグレーで誠実な印象。ビジネスシーンの定番。',
    textures: {
      sheet: assetUrl('assets/suits/suit-001-sheet.png'),
      sheetCols: 3,
      tintHex: null,
      directions: { 0: { col: 1 }, 90: { col: 0 }, 180: { col: 2 }, 270: { col: 0, flipH: true } },
    },
    colors: [
      { id: 'c1', name: 'ライトグレー', hex: '#b8bcc4', tintHex: null },
      { id: 'c2', name: 'チャコール', hex: '#4a5568', tintHex: '#4a5568' },
      { id: 'c3', name: 'ネイビー', hex: '#1a2744', tintHex: '#1a2744' },
    ],
    inStock: true,
  },
  {
    id: 'suit-002',
    name: 'ストレッチウール パンツスーツ',
    colorName: 'チャコール',
    colorHex: '#3d4555',
    pattern: 'solid',
    style: 'regular',
    matchBase: 92,
    description: '動きやすいパンツスーツ。シャープで知的な印象。',
    textures: {
      sheet: assetUrl('assets/suits/suit-002-sheet.png'),
      sheetCols: 5,
      tintHex: null,
      directions: { 0: { col: 4 }, 90: { col: 2 }, 180: { col: 3 }, 270: { col: 1 } },
    },
    colors: [
      { id: 'c1', name: 'チャコール', hex: '#3d4555', tintHex: null },
      { id: 'c2', name: 'ダークネイビー', hex: '#1e293b', tintHex: '#1e293b' },
      { id: 'c3', name: 'ブラック', hex: '#1a1a1a', tintHex: '#1a1a1a' },
    ],
    inStock: true,
  },
  {
    id: 'suit-003',
    name: 'スーパー120s ウール',
    colorName: 'ミディアムグレー',
    colorHex: '#9ca3af',
    pattern: 'solid',
    style: 'slim',
    matchBase: 88,
    description: '上質ウールのライトグレー。若々しく華やかな印象。',
    textures: {
      sheet: assetUrl('assets/suits/suit-003-sheet.png'),
      sheetCols: 5,
      tintHex: null,
      directions: { 0: { col: 2 }, 90: { col: 4 }, 180: { col: 1 }, 270: { col: 0 } },
    },
    colors: [
      { id: 'c1', name: 'ミディアムグレー', hex: '#9ca3af', tintHex: null },
      { id: 'c2', name: 'アッシュグレー', hex: '#cbd5e1', tintHex: '#cbd5e1' },
      { id: 'c3', name: 'ダークグレー', hex: '#64748b', tintHex: '#64748b' },
    ],
    inStock: true,
  },
  {
    id: 'suit-004',
    name: 'クラシック 3ピース',
    colorName: 'ライトグレー',
    colorHex: '#a8b0bc',
    pattern: 'herringbone',
    style: 'classic',
    matchBase: 90,
    description: 'ベスト付き3ピース。格式高く誠実な印象。',
    textures: {
      sheet: assetUrl('assets/suits/suit-004-sheet.png'),
      sheetCols: 4,
      tintHex: null,
      directions: { 0: { col: 1 }, 90: { col: 3 }, 180: { col: 2 }, 270: { col: 0 } },
    },
    colors: [
      { id: 'c1', name: 'ライトグレー', hex: '#a8b0bc', tintHex: null },
      { id: 'c2', name: 'チャコール', hex: '#475569', tintHex: '#475569' },
      { id: 'c3', name: 'ダークブラウン', hex: '#4a3728', tintHex: '#4a3728' },
    ],
    inStock: true,
  },
  {
    id: 'suit-005',
    name: 'モダンシルエット 2ボタン',
    colorName: 'チャコール',
    colorHex: '#374151',
    pattern: 'solid',
    style: 'slim',
    matchBase: 94,
    description: 'モダンなシルエット。華やかさとシャープさを両立。',
    textures: {
      sheet: assetUrl('assets/suits/suit-005-sheet.png'),
      sheetCols: 5,
      tintHex: null,
      directions: { 0: { col: 2 }, 90: { col: 4 }, 180: { col: 3 }, 270: { col: 0 } },
    },
    colors: [
      { id: 'c1', name: 'チャコール', hex: '#374151', tintHex: null },
      { id: 'c2', name: 'ミッドナイト', hex: '#1e3a5f', tintHex: '#1e3a5f' },
      { id: 'c3', name: 'スレート', hex: '#64748b', tintHex: '#64748b' },
    ],
    inStock: true,
  },
];

export function getMockSuitById(id: string): MockSuit {
  return MOCK_SUITS.find((s) => s.id === id) || MOCK_SUITS[0];
}

/** 選択中カラーを反映した試着用スーツ設定 */
export function resolveSuitForTryOn(config: SelectedTryOnConfig): MockSuit {
  const base = getMockSuitById(config.suitId);
  const color = base.colors.find((c) => c.id === config.colorId) || base.colors[0];
  return {
    ...base,
    colorName: color.name,
    colorHex: color.hex,
    textures: {
      ...base.textures,
      tintHex: color.tintHex ?? null,
    },
  };
}

export function getCompositeKey(suitId: string, colorId: string, direction: number): string {
  return `${suitId}-${colorId}-${direction}`;
}
