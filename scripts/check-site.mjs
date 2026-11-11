import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('dist');
const htmlFile = path.join(root, 'index.html');
const cssFile = path.join(root, 'style.css');
const html = await readFile(htmlFile, 'utf8');
const css = await readFile(cssFile, 'utf8');
const references = [
  ...[...html.matchAll(/\b(?:src|href|srcset)="([^"]+)"/g)].map(match => [htmlFile, match[1]]),
  ...[...css.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)].map(match => [cssFile, match[1]]),
];

for (const [file, reference] of references) {
  if (/^(?:[a-z]+:|#)/i.test(reference)) continue;
  if (reference.startsWith('/')) throw new Error(`Use a relative asset path for GitHub Pages: ${reference}`);
  const target = path.resolve(path.dirname(file), reference.split(/[?#]/)[0]);
  if (!target.startsWith(root + path.sep)) throw new Error(`Asset outside website directory: ${reference}`);
  const info = await stat(target);
  if (!info.isFile() || info.size === 0) throw new Error(`Missing or empty asset: ${reference}`);
}
console.log(`Checked ${references.length} asset references: ready for a GitHub Pages repository subpath.`);
