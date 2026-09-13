import { puzzleOutline, CELL, compositionBounds as bounds } from './entrance-model.js';

export function createIdentity() {
  const canvas = document.createElement('canvas');
  canvas.width = 2048; canvas.height = Math.round(2048 * (bounds.top - bounds.bottom) / (bounds.right - bounds.left));
  const ctx = canvas.getContext('2d');
  const text = (value, size, spacing, y, color) => {
    ctx.font = `300 ${size}px Inter, Arial, sans-serif`;
    ctx.fillStyle = color; ctx.textBaseline = 'middle';
    const letters = [...value], widths = letters.map(c => ctx.measureText(c).width);
    let x = (canvas.width - widths.reduce((a, b) => a + b, 0) - spacing * (letters.length - 1)) / 2;
    letters.forEach((letter, i) => { ctx.fillText(letter, x, y); x += widths[i] + spacing; });
  };
  const paint = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    text('PISCES', 298, 56, canvas.height * .44, '#edf0ed');
    text('PIECE TOGETHER THE UNIVERSE', 51, 8, canvas.height * .635, '#b9c8ce');
  };
  paint(); return { canvas, paint };
}

// One local, padded atlas keeps thousands of objects on the same draw call.
export function createArtworkAtlas(artwork, size = 512) {
  const ids = [...artwork.tiles.keys()], cols = 5, rows = Math.ceil(ids.length / cols), pad = 4;
  const canvas = document.createElement('canvas'); canvas.width = cols * size; canvas.height = rows * size;
  const ctx = canvas.getContext('2d'), rects = new Map();
  function update(id) {
    const index = ids.indexOf(id); if (index < 0) return;
    const x = index % cols * size, y = Math.floor(index / cols) * size;
    ctx.drawImage(artwork.tiles.get(id), x, y, size, size);
    rects.set(id, [(x + pad) / canvas.width, 1 - (y + size - pad) / canvas.height,
      (size - pad * 2) / canvas.width, (size - pad * 2) / canvas.height]);
  }
  ids.forEach(update);
  return { canvas, update, rect(id) { return rects.get(id) || rects.get('earth'); } };
}

export function createPuzzleMask() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d'), extent = CELL * 1.6;
  ctx.translate(64, 64); ctx.scale(128 / extent, -128 / extent);
  ctx.beginPath(); puzzleOutline(5).forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
  return canvas;
}
