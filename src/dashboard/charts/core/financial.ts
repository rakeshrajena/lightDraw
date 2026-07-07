import type { OhlcBar } from '../types';

export function toHeikinAshi(bars: OhlcBar[]): OhlcBar[] {
  const out: OhlcBar[] = [];
  for (const b of bars) {
    const close = (b.open + b.high + b.low + b.close) / 4;
    const open = out.length ? (out[out.length - 1].open + out[out.length - 1].close) / 2 : (b.open + b.close) / 2;
    const high = Math.max(b.high, open, close);
    const low = Math.min(b.low, open, close);
    out.push({ time: b.time, open, high, low, close, volume: b.volume });
  }
  return out;
}

export function toRenko(bars: OhlcBar[], brickSize: number): OhlcBar[] {
  const out: OhlcBar[] = [];
  if (!bars.length) return out;
  let price = bars[0].close;
  for (const b of bars) {
    let diff = b.close - price;
    while (Math.abs(diff) >= brickSize) {
      const dir = diff > 0 ? 1 : -1;
      const open = price;
      price += dir * brickSize;
      out.push({
        time: b.time,
        open,
        high: Math.max(open, price),
        low: Math.min(open, price),
        close: price,
      });
      diff = b.close - price;
    }
  }
  return out;
}

export function toKagi(bars: OhlcBar[], reversal: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  if (!bars.length) return pts;
  let dir = 0;
  let price = bars[0].close;
  pts.push({ x: 0, y: price });
  for (let i = 1; i < bars.length; i++) {
    const c = bars[i].close;
    if (dir >= 0 && c >= price + reversal) {
      dir = 1;
      price = c;
      pts.push({ x: i, y: price });
    } else if (dir <= 0 && c <= price - reversal) {
      dir = -1;
      price = c;
      pts.push({ x: i, y: price });
    } else if (dir === 1 && c < price - reversal) {
      dir = -1;
      price = c;
      pts.push({ x: i, y: price });
    } else if (dir === -1 && c > price + reversal) {
      dir = 1;
      price = c;
      pts.push({ x: i, y: price });
    }
  }
  return pts;
}

export function toPointAndFigure(bars: OhlcBar[], boxSize: number, reversal = 3): OhlcBar[] {
  const out: OhlcBar[] = [];
  if (!bars.length) return out;
  let col = 0;
  let price = bars[0].close;
  let dir: 'X' | 'O' | null = null;
  for (const b of bars) {
    if (!dir) {
      dir = b.close >= price ? 'X' : 'O';
      price = b.close;
      continue;
    }
    const move = b.close - price;
    const boxes = Math.floor(Math.abs(move) / boxSize);
    if (boxes >= reversal && ((dir === 'X' && move < 0) || (dir === 'O' && move > 0))) {
      dir = dir === 'X' ? 'O' : 'X';
      col++;
      price = b.close;
      out.push({ time: col, open: price, high: price + boxSize, low: price - boxSize, close: price });
    } else if (boxes > 0) {
      price += (move > 0 ? 1 : -1) * boxes * boxSize;
      out.push({ time: col, open: price, high: price + boxSize, low: price - boxSize, close: price });
    }
  }
  return out;
}

export function volumeProfile(bars: OhlcBar[], bins = 20): { price: number; volume: number }[] {
  if (!bars.length) return [];
  const lows = bars.map((b) => b.low);
  const highs = bars.map((b) => b.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const step = (max - min) / bins || 1;
  const profile = Array.from({ length: bins }, (_, i) => ({
    price: min + (i + 0.5) * step,
    volume: 0,
  }));
  for (const b of bars) {
    const vol = b.volume ?? 1;
    const idx = Math.min(bins - 1, Math.floor((b.close - min) / step));
    profile[idx].volume += vol;
  }
  return profile;
}

export const SAMPLE_OHLC: OhlcBar[] = [
  { time: '1', open: 100, high: 105, low: 98, close: 103, volume: 1200 },
  { time: '2', open: 103, high: 108, low: 101, close: 106, volume: 1500 },
  { time: '3', open: 106, high: 107, low: 99, close: 100, volume: 1800 },
  { time: '4', open: 100, high: 104, low: 97, close: 102, volume: 1100 },
  { time: '5', open: 102, high: 110, low: 101, close: 109, volume: 2000 },
  { time: '6', open: 109, high: 112, low: 105, close: 107, volume: 1600 },
  { time: '7', open: 107, high: 109, low: 103, close: 104, volume: 1300 },
];
