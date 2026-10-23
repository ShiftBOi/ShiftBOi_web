/**
 * ShiftBOi service figures — soft isometric hairline plates.
 * Projection kernel adapted from iso-glow / isoglow (MIT).
 * Scenes + violet palette are original to ShiftBOi — not copies of other brands.
 * Run: node scripts/build-service-figures.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../public/brand/services");
mkdirSync(OUT, { recursive: true });

const VIOLET = {
  a: "#7c3aed",
  h: "#a78bfa",
  d: "#f3e8ff",
  g: "#ede9fe",
  c: "#ffffff",
};

const C = Math.cos(Math.PI / 6);
const S = Math.sin(Math.PI / 6);

function kernel(OX, OY) {
  const P = (x, y, z) => [(x - y) * C + OX, (x + y) * S - z + OY];
  const D = (x, y, z) => [(x - y) * C, (x + y) * S - z];
  const plane = (O, U, V) => {
    const o = P(...O);
    const u = D(...U);
    const v = D(...V);
    return `matrix(${u[0]} ${u[1]} ${v[0]} ${v[1]} ${o[0]} ${o[1]})`;
  };
  const TOP = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 1, 0]);
  const FRONT = (x, y, z) => plane([x, y, z], [1, 0, 0], [0, 0, -1]);
  const SIDE = (x, y, z) => plane([x, y, z], [0, -1, 0], [0, 0, -1]);
  const rect = (t, w, h, r = 0, cls = "face") =>
    `<g transform="${t}"><rect class="${cls}" width="${w}" height="${h}" rx="${r}"/></g>`;
  const rounded = (x, y, z, w, d, h, r, cls) => {
    r = Math.min(r, w / 2, d / 2);
    const n = 10;
    const z1 = z + h;
    const q = Math.PI / 4;
    const H = Math.PI / 2;
    const c = cls ? " " + cls : "";
    const arc = (cx, cy, a0, a1) => {
      const o = [];
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
      }
      return o;
    };
    const ring = [
      ...arc(x + w - r, y + r, -H, 0),
      ...arc(x + w - r, y + d - r, 0, H),
      ...arc(x + r, y + d - r, H, 2 * H),
      ...arc(x + r, y + r, 2 * H, 3 * H),
    ];
    const vis = [
      ...arc(x + w - r, y + r, -q, 0),
      ...arc(x + w - r, y + d - r, 0, H),
      ...arc(x + r, y + d - r, H, 3 * q),
    ];
    const d3 = (pts) =>
      "M" +
      pts.map((p) => P(...p).map((v) => v.toFixed(2)).join(" ")).join("L") +
      "Z";
    const wall = [
      ...vis.map(([a, b]) => [a, b, z]),
      ...vis
        .slice()
        .reverse()
        .map(([a, b]) => [a, b, z1]),
    ];
    return `<path class="face${c}" d="${d3(wall)}"/><path class="face top${c}" d="${d3(ring.map(([a, b]) => [a, b, z1]))}"/>`;
  };
  const box = (x, y, z, w, d, h, r = 0) =>
    r > 0
      ? rounded(x, y, z, w, d, h, r, "")
      : rect(SIDE(x + w, y + d, z + h), d, h) +
        rect(FRONT(x, y + d, z + h), w, h) +
        rect(TOP(x, y, z + h), w, d, 0, "face top");
  const boxc = (x, y, z, w, d, h, r, cls) =>
    r > 0
      ? rounded(x, y, z, w, d, h, r, cls)
      : rect(SIDE(x + w, y + d, z + h), d, h, 0, "face " + cls) +
        rect(FRONT(x, y + d, z + h), w, h, 0, "face " + cls) +
        rect(TOP(x, y, z + h), w, d, 0, "face top " + cls);
  const path = (pts) =>
    "M" + pts.map((p) => P(...p).map((n) => n.toFixed(2)).join(" ")).join("L");
  return { P, D, TOP, FRONT, SIDE, rect, box, boxc, path };
}

function frame(points, margin = 0.04, aspect = 4 / 3) {
  const d = points.map(([x, y, z]) => [(x - y) * C, (x + y) * S - z]);
  let x0 = Math.min(...d.map((p) => p[0]));
  let x1 = Math.max(...d.map((p) => p[0]));
  let y0 = Math.min(...d.map((p) => p[1]));
  let y1 = Math.max(...d.map((p) => p[1]));
  const m = margin * Math.max(x1 - x0, y1 - y0);
  let w = x1 - x0 + 2 * m;
  let h = y1 - y0 + 2 * m;
  let ox = m - x0;
  let oy = m - y0;
  if (w / h < aspect) {
    const nw = h * aspect;
    ox += (nw - w) / 2;
    w = nw;
  } else {
    const nh = w / aspect;
    oy += (nh - h) / 2;
    h = nh;
  }
  return {
    ...kernel(ox, oy),
    viewBox: `0 0 ${w.toFixed(1)} ${h.toFixed(1)}`,
  };
}

function figCss(shade) {
  return `
.sb-fig{
  --body:#f3f1f8;--deck:#ffffff;--line:#1f1630;--detail:#b8b0c8;--recess:#ebe6f4;
  --ink:#6b6480;--ink-hi:#140c25;--glass:#ffffff;
  --accent:${shade.a};--accent-hi:${shade.h};
  --lit-fill:${shade.d};--lit-top:${shade.c};--glass-hot:${shade.g};--chip-fill:${shade.c};
}
.sb-fig .face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.sb-fig .face.top{fill:var(--deck)}
.sb-fig .face.recess{fill:var(--recess)}
.sb-fig .face.lit{fill:var(--lit-fill);stroke:var(--accent)}
.sb-fig .face.top.lit{fill:var(--lit-top);stroke:var(--accent-hi)}
.sb-fig .detail{fill:none;stroke:var(--detail);stroke-width:.9;vector-effect:non-scaling-stroke}
.sb-fig .wire{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.sb-fig .wire.hot{stroke:var(--accent);filter:url(#soft);stroke-dasharray:5 9;opacity:.9}
.sb-fig .glass{fill:var(--glass);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}
.sb-fig .glass.hot{fill:var(--glass-hot);stroke:var(--accent);filter:url(#soft)}
.sb-fig .label{fill:var(--ink);font:500 11px ui-sans-serif,system-ui,sans-serif}
.sb-fig .label.hi{fill:var(--ink-hi)}
.sb-fig .label.accent{fill:var(--accent);font-weight:600}
.sb-fig .chip{fill:var(--chip-fill);stroke:var(--accent);stroke-width:1;vector-effect:non-scaling-stroke}
.sb-fig .led{fill:var(--accent);filter:url(#soft)}
.sb-fig .halo{fill:var(--accent);opacity:.14;filter:url(#bloom)}
`;
}

function wrap(viewBox, inner, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" class="sb-fig" data-fig="${id}" role="img" aria-hidden="true">
  <defs>
    <style>${figCss(VIOLET)}</style>
    <filter id="soft" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bloom" filterUnits="userSpaceOnUse" x="-2000" y="-2000" width="6000" height="6000"><feGaussianBlur stdDeviation="9"/></filter>
  </defs>
  ${inner}
</svg>`;
}

const A = VIOLET.a;
const stro = `stroke="#1f1630" stroke-width="1" vector-effect="non-scaling-stroke"`;

/* —— 01 Brand — component kit / style board (not ecommerce) —— */
function figBrand() {
  const sw = 152;
  const sd = 102;
  const TK = 3.4;
  const K = frame(
    [
      [-6, -6, 0],
      [sw + 6, -6, 0],
      [-6, sd + 6, 0],
      [sw + 6, sd + 6, 0],
      [0, 0, 14],
      [sw, sd, 14],
    ],
    0.05
  );
  let s = `<defs>
    <clipPath id="clip-win"><rect width="${sw}" height="${sd}" rx="8"/></clipPath>
    <clipPath id="clip-rail"><rect width="36" height="78" rx="6"/></clipPath>
    <clipPath id="clip-stage"><rect width="72" height="78" rx="7"/></clipPath>
    <clipPath id="clip-props"><rect width="34" height="78" rx="6"/></clipPath>
  </defs>`;

  // main window
  s += K.box(0, 0, 0, sw, sd, TK, 8);
  s += `<g transform="${K.TOP(0, 0, TK)}" clip-path="url(#clip-win)">
    <rect fill="#ffffff" width="${sw}" height="${sd}" rx="8"/>
    <rect fill="#140c25" width="${sw}" height="14"/>
    <circle fill="${A}" cx="9" cy="7" r="1.8"/>
    <circle fill="#6b6480" cx="16" cy="7" r="1.8"/>
    <circle fill="#6b6480" cx="23" cy="7" r="1.8"/>
    <text fill="#c4b5fd" font-family="ui-monospace,monospace" font-size="4.8" font-weight="700" text-anchor="middle" x="${sw / 2}" y="9.2">ShiftBOi · kit</text>
  </g>`;

  // tokens rail
  s += K.box(4, 18, 6, 36, 78, TK, 6);
  s += `<g transform="${K.TOP(4, 18, 6 + TK)}" clip-path="url(#clip-rail)">
    <rect fill="#ffffff" width="36" height="78" rx="6"/>
    <text fill="#6b6480" font-family="ui-sans-serif,system-ui,sans-serif" font-size="3.6" font-weight="700" x="4" y="9">Tokens</text>
    <rect fill="${A}" x="4" y="14" width="10" height="10" rx="2.2"/>
    <rect fill="#a78bfa" x="16" y="14" width="10" height="10" rx="2.2"/>
    <rect fill="#140c25" x="4" y="28" width="10" height="10" rx="2.2"/>
    <rect fill="#e9e4f6" stroke="#c4b5fd" x="16" y="28" width="10" height="10" rx="2.2"/>
    <text fill="#6b6480" font-family="ui-monospace,monospace" font-size="2.8" x="4" y="48">space/4</text>
    <rect fill="#f3e8ff" x="4" y="52" width="28" height="5" rx="1.5"/>
    <rect fill="#ede9fe" x="4" y="60" width="22" height="5" rx="1.5"/>
    <rect fill="#ddd6fe" x="4" y="68" width="16" height="5" rx="1.5"/>
  </g>`;

  // center stage card
  s += K.box(44, 18, 9, 72, 78, TK, 7);
  s += `<g transform="${K.TOP(44, 18, 9 + TK)}" clip-path="url(#clip-stage)">
    <rect fill="#ffffff" width="72" height="78" rx="7"/>
    <rect fill="#f3e8ff" width="72" height="11"/>
    <text fill="#140c25" font-family="ui-sans-serif,system-ui,sans-serif" font-size="4.4" font-weight="800" x="5" y="8">Hero block</text>
    <rect fill="#140c25" x="8" y="20" width="40" height="6" rx="1.5"/>
    <rect fill="#c4b5fd" x="8" y="30" width="56" height="3.5" rx="1"/>
    <rect fill="#ddd6fe" x="8" y="37" width="44" height="3.5" rx="1"/>
    <rect fill="none" stroke="${A}" stroke-width="1.2" x="8" y="46" width="34" height="18" rx="3">
      <animate attributeName="width" values="34;40;28;34" dur="5.5s" repeatCount="indefinite"/>
    </rect>
    <rect fill="${A}" x="12" y="52" width="18" height="6" rx="3"/>
    <text fill="#fff" font-family="ui-sans-serif,system-ui,sans-serif" font-size="3" font-weight="700" x="15" y="56.5">CTA</text>
  </g>`;

  // props panel
  s += K.box(120, 18, 6, 34, 78, TK, 6);
  s += `<g transform="${K.TOP(120, 18, 6 + TK)}" clip-path="url(#clip-props)">
    <rect fill="#ffffff" width="34" height="78" rx="6"/>
    <text fill="#140c25" font-family="ui-sans-serif,system-ui,sans-serif" font-size="4" font-weight="700" x="4" y="9">Props</text>
    <text fill="#6b6480" font-family="ui-monospace,monospace" font-size="2.8" x="4" y="20">radius</text>
    <rect fill="#f3e8ff" stroke="#c4b5fd" x="4" y="23" width="26" height="6" rx="1.8"/>
    <text fill="#140c25" font-family="ui-monospace,monospace" font-size="2.9" x="8" y="27.5">12</text>
    <text fill="#6b6480" font-family="ui-monospace,monospace" font-size="2.8" x="4" y="40">tone</text>
    <rect fill="${A}" x="4" y="43" width="8" height="8" rx="2"/>
    <rect fill="#a78bfa" x="14" y="43" width="8" height="8" rx="2"/>
    <rect fill="#140c25" x="24" y="43" width="6" height="8" rx="2"/>
    <text fill="#6b6480" font-family="ui-monospace,monospace" font-size="2.8" x="4" y="62">weight</text>
    <rect fill="#ebe6f4" x="4" y="65" width="26" height="6" rx="1.8"/>
    <text fill="#140c25" font-family="ui-monospace,monospace" font-size="2.8" x="8" y="69.5">Bold</text>
  </g>`;

  // pixel cursor — tiny drift on stage
  s += `<g transform="${K.TOP(44, 18, 9 + TK + 0.4)}">
    <g>
      <animateTransform attributeName="transform" type="translate" values="46 58;52 54;46 58" dur="5.2s" repeatCount="indefinite"/>
      <path fill="${A}" d="M0 0h2v1h1v1h1v1h1v1h1v1h1v1h1v1h1v6h-1v1h-1v1h-1v1h-1v1H5v1H4v1H3v1H2v-3H1v-1H0V0z"/>
    </g>
  </g>`;

  return wrap(K.viewBox, s, "brand");
}

/* —— 02 Develop — laptop + editor + floating API chip —— */
function figWeb() {
  const W = 148;
  const D = 96;
  const HB = 4.2;
  const bx = 20;
  const by = 58;
  const lidH = 86;
  const lidD = 5;
  const lidY = by - 0.5;

  const K = frame(
    [
      [bx - 4, by - 8, 0],
      [bx + W + 8, by - 8, 0],
      [bx - 4, by + D + 4, 0],
      [bx + W + 8, by + D + 4, 0],
      [bx, lidY, HB + lidH],
      [bx + W, lidY + lidD, HB + lidH],
    ],
    0.03
  );
  let s = "";

  s += K.box(bx, by, 0, W, D, HB, 6.5);
  s += `<g transform="${K.TOP(bx, by, HB)}">
    <rect class="detail" x="6" y="5" width="${W - 12}" height="${D - 10}" rx="4.5"/>
  </g>`;

  // keyboard grid
  const keys = [];
  const rows = [
    { y: 10, n: 14, w: 7.6 },
    { y: 19, n: 14, w: 7.6 },
    { y: 28, n: 13, w: 8.0 },
    { y: 37, n: 12, w: 8.4 },
    { y: 46, n: 3, w: 18, gap: 4 },
  ];
  for (const row of rows) {
    const gap = row.gap ?? 0.85;
    let x = 10;
    for (let i = 0; i < row.n; i++) {
      keys.push(
        `<rect fill="#fff" ${stro} x="${x.toFixed(2)}" y="${row.y}" width="${row.w}" height="7.2" rx="1.1"/>`
      );
      x += row.w + gap;
    }
  }
  s += `<g transform="${K.TOP(bx, by, HB)}">${keys.join("")}</g>`;
  // one key soft flash
  s += `<g transform="${K.TOP(bx, by, HB)}">
    <rect fill="${A}" x="46.2" y="19" width="7.6" height="7.2" rx="1.1" opacity="0">
      <animate attributeName="opacity" values="0;0;0.4;0;0" keyTimes="0;0.2;0.35;0.5;1" dur="4.8s" repeatCount="indefinite"/>
    </rect>
  </g>`;

  // screen lid
  s += K.box(bx, lidY, HB, W, lidD, lidH, 3.2);
  s += `<g transform="${K.FRONT(bx, lidY + lidD, HB + lidH)}">
    <rect fill="#140c25" ${stro} width="${W}" height="${lidH}" rx="2.4"/>
    <rect fill="#0a0614" x="4" y="4" width="${W - 8}" height="${lidH - 8}" rx="1.6"/>
    <rect fill="${A}" x="10" y="14" width="18" height="3.2" rx="0.8"/>
    <rect fill="#71717a" x="32" y="14" width="48" height="3.2" rx="0.8"/>
    <rect fill="#a78bfa" x="14" y="24" width="14" height="3" rx="0.8"/>
    <rect fill="#52525b" x="32" y="24" width="62" height="3" rx="0.8"/>
    <rect fill="#c4b5fd" x="14" y="34" width="28" height="3" rx="0.8"/>
    <rect fill="#3f3f46" x="46" y="34" width="40" height="3" rx="0.8"/>
    <rect fill="${A}" x="14" y="44" width="10" height="3" rx="0.8"/>
    <rect fill="#404040" x="28" y="44" width="70" height="3" rx="0.8"/>
    <rect fill="${A}" x="14" y="56" width="3.2" height="7" rx="0.6">
      <animate attributeName="opacity" values="1;0;1" dur="1.35s" repeatCount="indefinite"/>
    </rect>
  </g>`;

  return wrap(K.viewBox, s, "web");
}

/* —— 03 Performance — score plate + rising bars —— */
function figOpt() {
  const K = frame(
    [
      [-10, -10, 0],
      [170, -10, 0],
      [-10, 120, 0],
      [170, 120, 0],
      [0, 0, 70],
      [160, 110, 70],
    ],
    0.05
  );
  let s = "";

  s += K.box(0, 0, 0, 160, 110, 5, 10);
  s += `<g transform="${K.TOP(0, 0, 5)}">
    <rect class="detail" x="8" y="8" width="144" height="94" rx="7"/>
  </g>`;

  // score card
  s += K.boxc(12, 18, 5, 52, 40, 4, 6, "lit");
  s += `<g transform="${K.TOP(12, 18, 9)}">
    <text fill="#140c25" font-family="ui-sans-serif,system-ui,sans-serif" font-size="22" font-weight="800" x="8" y="24">98</text>
    <text fill="${A}" font-family="ui-monospace,monospace" font-size="5" font-weight="700" letter-spacing="0.12em" x="8" y="33">SCORE</text>
    <circle class="led" cx="44" cy="10" r="2.4">
      <animate attributeName="opacity" values="1;.4;1" dur="2.8s" repeatCount="indefinite"/>
    </circle>
  </g>`;

  // metric chips
  const chips = ["LCP", "INP", "CLS"];
  chips.forEach((label, i) => {
    const x = 72 + i * 28;
    s += K.box(x, 22, 5, 24, 16, 3, 4);
    s += `<g transform="${K.TOP(x, 22, 8)}">
      <text fill="${A}" font-family="ui-monospace,monospace" font-size="5" font-weight="700" text-anchor="middle" x="12" y="11">${label}</text>
    </g>`;
  });

  // bars
  const heights = [18, 28, 40, 52];
  heights.forEach((h, i) => {
    const x = 28 + i * 32;
    s += K.boxc(x, 70, 5, 18, 22, h, 3, i === 3 ? "lit" : "");
  });

  return wrap(K.viewBox, s, "opt");
}

/* —— 04 SEO — search plate + ranked stack —— */
function figSeo() {
  const K = frame(
    [
      [-8, -8, 0],
      [180, -8, 0],
      [-8, 130, 0],
      [180, 130, 0],
      [0, 0, 40],
      [170, 120, 40],
    ],
    0.05
  );
  let s = "";

  // search bar
  s += K.box(8, 8, 0, 150, 36, 5, 14);
  s += `<g transform="${K.TOP(8, 8, 5)}">
    <circle fill="none" stroke="${A}" stroke-width="1.6" cx="14" cy="18" r="6"/>
    <path stroke="${A}" stroke-width="1.6" stroke-linecap="round" d="M18.5 22.5l5 5"/>
    <rect fill="#d4d0e0" x="28" y="14" width="70" height="7" rx="2">
      <animate attributeName="width" values="40;78;55;78;40" dur="6s" repeatCount="indefinite"/>
    </rect>
    <rect fill="${A}" x="112" y="10" width="28" height="16" rx="8"/>
    <text fill="#fff" font-family="ui-monospace,monospace" font-size="6" font-weight="800" text-anchor="middle" x="126" y="21">GO</text>
  </g>`;

  // result rows
  const rows = [
    { y: 52, lit: false, label: "" },
    { y: 78, lit: true, label: "#1" },
    { y: 104, lit: false, label: "" },
  ];
  for (const row of rows) {
    s += row.lit
      ? K.boxc(16, row.y, 0, 140, 22, 4, 5, "lit")
      : K.box(16, row.y, 0, 140, 22, 4, 5);
    s += `<g transform="${K.TOP(16, row.y, 4)}">
      <rect fill="${row.lit ? A : "#c4b5fd"}" x="6" y="6" width="10" height="10" rx="2"/>
      <rect fill="${row.lit ? "#e9d5ff" : "#d4d0e0"}" x="22" y="8" width="${row.lit ? 70 : 90}" height="6" rx="1.5"/>
      ${
        row.label
          ? `<text fill="${A}" font-family="ui-monospace,monospace" font-size="8" font-weight="800" x="110" y="15">
        <animate attributeName="opacity" values="1;.6;1" dur="3.6s" repeatCount="indefinite"/>${row.label}
      </text>`
          : ""
      }
    </g>`;
  }

  return wrap(K.viewBox, s, "seo");
}

/* —— 05 Ship — BUILD → TEST → LIVE cubes + rail —— */
function figDevops() {
  const K = frame(
    [
      [-10, -10, 0],
      [200, -10, 0],
      [-10, 120, 0],
      [200, 120, 0],
      [0, 0, 50],
      [190, 110, 50],
    ],
    0.05
  );
  let s = "";

  const nodes = [
    { x: 8, label: "BUILD", lit: false },
    { x: 72, label: "TEST", lit: true },
    { x: 136, label: "LIVE", lit: false },
  ];
  nodes.forEach((n, i) => {
    s += n.lit
      ? K.boxc(n.x, 36, 8, 44, 40, 28, 7, "lit")
      : K.box(n.x, 36, 8, 44, 40, 28, 7);
    s += `<g transform="${K.TOP(n.x, 36, 36)}">
      <text fill="${n.lit ? A : "#140c25"}" font-family="ui-monospace,monospace" font-size="7" font-weight="800" text-anchor="middle" x="22" y="24">${n.label}</text>
    </g>`;
    if (i === 2) {
      s += `<g transform="${K.TOP(n.x, 36, 36)}">
        <circle cx="36" cy="8" r="3" fill="#22c55e">
          <animate attributeName="opacity" values="1;.35;1" dur="2.4s" repeatCount="indefinite"/>
        </circle>
      </g>`;
    }
    if (i < 2) {
      const ax = n.x + 46;
      s += `<path class="wire hot" d="${K.path([
        [ax, 56, 22],
        [ax + 20, 56, 22],
      ])}" stroke-dasharray="6 8">
        <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.8s" repeatCount="indefinite"/>
      </path>`;
    }
  });

  // progress rail
  s += K.box(16, 92, 0, 160, 16, 4, 6);
  s += `<g transform="${K.TOP(16, 92, 4)}">
    <rect fill="#ebe6f4" x="4" y="4" width="152" height="8" rx="4"/>
    <rect fill="${A}" x="4" y="4" width="108" height="8" rx="4"/>
    <circle fill="${A}" cx="112" cy="8" r="5" stroke="#fff" stroke-width="1.5">
      <animate attributeName="cx" values="108;118;108" dur="5s" repeatCount="indefinite"/>
    </circle>
  </g>`;

  // badge
  s += K.boxc(12, 6, 0, 40, 18, 3, 6, "lit");
  s += `<g transform="${K.TOP(12, 6, 3)}">
    <text fill="${A}" font-family="ui-monospace,monospace" font-size="6" font-weight="800" text-anchor="middle" x="20" y="12">CI/CD</text>
  </g>`;

  return wrap(K.viewBox, s, "devops");
}

/* —— 06 Maint — hub + satellite nodes —— */
function figMaint() {
  const K = frame(
    [
      [-20, -20, 0],
      [180, -20, 0],
      [-20, 160, 0],
      [180, 160, 0],
      [0, 0, 55],
      [160, 140, 55],
    ],
    0.05
  );
  let s = "";

  // base plate
  s += K.box(20, 30, 0, 120, 90, 5, 12);
  s += `<g transform="${K.TOP(20, 30, 5)}">
    <rect class="detail" x="8" y="8" width="104" height="74" rx="8"/>
  </g>`;

  // hub
  s += K.boxc(62, 58, 5, 36, 34, 28, 8, "lit");
  s += `<g transform="${K.TOP(62, 58, 33)}">
    <circle fill="#fff" cx="18" cy="17" r="8"/>
    <rect fill="${A}" x="15" y="11" width="6" height="12" rx="1.2"/>
  </g>`;

  const sats = [
    { x: 70, y: 8, lit: false },
    { x: 128, y: 40, lit: true },
    { x: 120, y: 100, lit: false },
    { x: 40, y: 108, lit: false },
    { x: 8, y: 48, lit: false },
  ];
  for (const sat of sats) {
    s += sat.lit
      ? K.boxc(sat.x, sat.y, 12, 22, 20, 14, 5, "lit")
      : K.box(sat.x, sat.y, 12, 22, 20, 14, 5);
    s += `<g transform="${K.TOP(sat.x, sat.y, 26)}">
      <circle fill="${sat.lit ? A : "#a78bfa"}" cx="11" cy="10" r="3.2"/>
    </g>`;
    // wire to hub center ~80,75,19
    s += `<path class="wire${sat.lit ? " hot" : ""}" d="${K.path([
      [sat.x + 11, sat.y + 10, 26],
      [80, 75, 33],
    ])}"/>`;
  }

  // pulse on live node
  s += `<g transform="${K.TOP(128, 40, 26)}">
    <circle fill="none" stroke="${A}" stroke-width="1.4" cx="11" cy="10" r="8">
      <animate attributeName="r" values="7;12;7" dur="4.5s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values=".55;0;.55" dur="4.5s" repeatCount="indefinite"/>
    </circle>
  </g>`;

  return wrap(K.viewBox, s, "maint");
}

const figs = [
  ["01-brand.svg", figBrand],
  ["02-web.svg", figWeb],
  ["03-opt.svg", figOpt],
  ["04-seo.svg", figSeo],
  ["05-devops.svg", figDevops],
  ["06-maint.svg", figMaint],
];

for (const [name, fn] of figs) {
  const svg = fn();
  writeFileSync(join(OUT, name), svg);
  console.log("wrote", name, `${(svg.length / 1024).toFixed(1)}kb`);
}
