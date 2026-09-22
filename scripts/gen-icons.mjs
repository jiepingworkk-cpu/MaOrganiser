import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = ~0;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function distToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function png(size) {
  const raw = Buffer.alloc((1 + size * 4) * size);
  const half = size / 2;
  const r = 0.2 * size;
  const ringR = 0.46 * size;
  const ringW = 0.075 * size;
  const checkA = [0.36 * size, 0.5 * size];
  const checkB = [0.485 * size, 0.62 * size];
  const checkC = [0.66 * size, 0.36 * size];
  const stroke = 0.05 * size;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const o = rowStart + 1 + x * 4;

      // rounded-rect alpha
      const cx = Math.max(Math.abs(px - half) - (half - r), 0);
      const cy = Math.max(Math.abs(py - half) - (half - r), 0);
      const inside = Math.hypot(cx, cy) <= r;

      let col = [15, 23, 42]; // slate-900
      if (inside) {
        const d = Math.hypot(px - half, py - half);
        if (d >= ringR - ringW && d <= ringR + ringW) {
          col = [249, 115, 22]; // orange-500 ring
        } else {
          const d1 = distToSegment(px, py, ...checkA, ...checkB);
          const d2 = distToSegment(px, py, ...checkB, ...checkC);
          if (d1 <= stroke || d2 <= stroke) col = [255, 255, 255];
        }
      }

      raw[o] = col[0];
      raw[o + 1] = col[1];
      raw[o + 2] = col[2];
      raw[o + 3] = inside ? 255 : 0;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  const idat = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

mkdirSync(join(root, "public", "icons"), { recursive: true });
for (const s of [192, 512]) {
  const out = join(root, "public", "icons", `icon-${s}.png`);
  writeFileSync(out, png(s));
  console.log("generated", out);
}