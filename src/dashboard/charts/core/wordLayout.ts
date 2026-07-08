import type { WordItem } from '../types';

export interface PlacedWord {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  value?: number;
}

interface BBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function wordBox(x: number, y: number, text: string, fontSize: number): BBox {
  const w = text.length * fontSize * 0.58;
  const h = fontSize * 1.15;
  return { x, y, w, h };
}

function overlaps(a: BBox, b: BBox, pad = 3): boolean {
  return a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;
}

/** Spiral word placement with simple collision avoidance (largest words first). */
export function layoutWordCloud(words: WordItem[], width: number, height: number): PlacedWord[] {
  const maxVal = Math.max(...words.map((w) => w.value), 1);
  const cx = width / 2;
  const cy = height / 2;
  const sorted = [...words].sort((a, b) => b.value - a.value);
  const placed: PlacedWord[] = [];
  const boxes: BBox[] = [];

  for (const w of sorted) {
    const fontSize = 12 + (w.value / maxVal) * 26;
    const estW = w.text.length * fontSize * 0.58;
    let angle = 0;
    let radius = 0;
    let found = false;

    for (let t = 0; t < 720; t++) {
      const x = cx + radius * Math.cos(angle) - estW / 2;
      const y = cy + radius * Math.sin(angle) - fontSize / 2;
      const box = wordBox(x, y, w.text, fontSize);
      const inBounds =
        box.x >= 4 &&
        box.y >= 4 &&
        box.x + box.w <= width - 4 &&
        box.y + box.h <= height - 4;
      const clear = inBounds && !boxes.some((b) => overlaps(box, b));

      if (clear) {
        placed.push({ text: w.text, x, y, fontSize, value: w.value });
        boxes.push(box);
        found = true;
        break;
      }
      angle += 0.42;
      radius += 0.55;
    }

    if (!found) {
      const x = cx - estW / 2 + (placed.length % 3) * 12;
      const y = cy - fontSize / 2 + (placed.length % 5) * 8;
      placed.push({ text: w.text, x, y, fontSize, value: w.value });
      boxes.push(wordBox(x, y, w.text, fontSize));
    }
  }

  return placed;
}
