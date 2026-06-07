/**
 * public/ 配下の静的ファイルを Vite の base（GitHub Pages では /virtual-suit-signage/）に合わせた URL で返す。
 */
export function assetUrl(path: string): string {
  const normalized = path.replace(/^\//, '');
  return `${import.meta.env.BASE_URL}${normalized}`;
}
