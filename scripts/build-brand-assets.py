#!/usr/bin/env python3
"""
ShiftBOi brand assets — geometric mark → SVG + social OG card.

Method (same craft as TTIANQII's python→SVG mark workflow — not HydraDB):
  construct the mark mathematically, emit clean SVG paths, rasterize
  favicons + Open Graph preview.

Mark concept — "Shift stairs":
  Three rounded bars stacked with a progressive left shift. Reads as
  motion / iteration (the "Shift") and forms an abstract S without
  copying TTIANQII's radial L-hooks or HydraDB's glyph.
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT_BRAND = ROOT / "public" / "brand"
OUT_PUBLIC = ROOT / "public"

INK = "#000000"
PAPER = "#ffffff"
VIOLET = "#7c3aed"
VIOLET_BRIGHT = "#a78bfa"
VIOLET_SOFT = "#c4b5fd"
MUTED = "#a1a1aa"
HAIRLINE = "#27272a"


def hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)


def rounded_rect_path(x: float, y: float, w: float, h: float, r: float) -> str:
    r = min(r, w / 2, h / 2)
    return (
        f"M{x + r:.3f},{y:.3f} "
        f"H{x + w - r:.3f} "
        f"Q{x + w:.3f},{y:.3f} {x + w:.3f},{y + r:.3f} "
        f"V{y + h - r:.3f} "
        f"Q{x + w:.3f},{y + h:.3f} {x + w - r:.3f},{y + h:.3f} "
        f"H{x + r:.3f} "
        f"Q{x:.3f},{y + h:.3f} {x:.3f},{y + h - r:.3f} "
        f"V{y + r:.3f} "
        f"Q{x:.3f},{y:.3f} {x + r:.3f},{y:.3f} Z"
    )


def build_mark_bars(size: float = 32.0):
    """
    Three horizontal bars; each lower bar shifts left (cascade / stairs).
    Returns list of (x, y, w, h, fill_role).
    """
    pad_y = size * 0.16
    bar_h = size * 0.18
    gap = size * 0.085
    bar_w = size * 0.58
    shift = size * 0.14  # per-step offset
    # Center the cascade block horizontally
    total_span = bar_w + shift * 2
    origin_x = (size - total_span) / 2
    y0 = pad_y

    # top: rightmost, mid: center, bottom: leftmost
    bars = [
        (origin_x + shift * 2, y0, bar_w, bar_h, "deep"),
        (origin_x + shift, y0 + bar_h + gap, bar_w, bar_h, "bright"),
        (origin_x, y0 + 2 * (bar_h + gap), bar_w, bar_h, "soft"),
    ]
    radius = bar_h * 0.45
    return bars, radius


def fill_for(role: str, *, colored: bool) -> str:
    if not colored:
        return "currentColor"
    return {
        "deep": VIOLET,
        "bright": VIOLET_BRIGHT,
        "soft": VIOLET_SOFT,
    }[role]


def emit_mark_svg(*, colored: bool, filename: str) -> Path:
    bars, radius = build_mark_bars(32)
    paths = []
    for x, y, w, h, role in bars:
        d = rounded_rect_path(x, y, w, h, radius)
        fill = fill_for(role, colored=colored)
        paths.append(f'  <path fill="{fill}" d="{d}"/>')
    body = "\n".join(paths)
    if colored:
        svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="ShiftBOi">
  <rect width="32" height="32" rx="8" fill="{INK}"/>
{body}
</svg>
"""
    else:
        svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" role="img" aria-label="ShiftBOi">
  <!-- python geometric mark — shift stairs (ShiftBOi) -->
{body}
</svg>
"""
    path = OUT_BRAND / filename
    path.write_text(svg, encoding="utf-8")
    return path


def emit_wordmark_svg() -> Path:
    bars, radius = build_mark_bars(32)
    mark_paths = []
    for x, y, w, h, role in bars:
        fill = fill_for(role, colored=True)
        mark_paths.append(
            f'    <path fill="{fill}" d="{rounded_rect_path(x, y, w, h, radius)}"/>'
        )
    marks = "\n".join(mark_paths)
    svg = f"""<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 40" role="img" aria-label="ShiftBOi">
  <rect x="2" y="2" width="36" height="36" rx="9" fill="{INK}"/>
  <g transform="translate(4,4)">
{marks}
  </g>
  <text x="48" y="27"
        font-family="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
        font-size="20" font-weight="600" letter-spacing="-0.03em" fill="{PAPER}">ShiftBOi</text>
</svg>
"""
    path = OUT_BRAND / "shiftboi-wordmark.svg"
    path.write_text(svg, encoding="utf-8")
    return path


def render_mark_rgba(size: int, *, on_black: bool = True) -> Image.Image:
    bg = (0, 0, 0, 255) if on_black else (0, 0, 0, 0)
    img = Image.new("RGBA", (size, size), bg)
    draw = ImageDraw.Draw(img)
    if on_black:
        # rounded app-icon plate
        draw.rounded_rectangle(
            [0, 0, size - 1, size - 1],
            radius=max(4, int(size * 0.22)),
            fill=(0, 0, 0, 255),
        )
    bars, radius = build_mark_bars(float(size))
    for x, y, w, h, role in bars:
        fill = fill_for(role, colored=True)
        draw.rounded_rectangle(
            [x, y, x + w, y + h],
            radius=max(1, int(radius)),
            fill=fill,
        )
    return img


def save_icons() -> None:
    for size, name in [(32, "favicon-32.png"), (192, "icon-192.png"), (512, "icon-512.png")]:
        render_mark_rgba(size, on_black=True).save(OUT_PUBLIC / name, "PNG")

    # Multi-resolution ICO from the 32px master
    master = render_mark_rgba(32, on_black=True).convert("RGBA")
    im16 = master.resize((16, 16), Image.Resampling.LANCZOS)
    im48 = master.resize((48, 48), Image.Resampling.LANCZOS)
    im16.save(
        OUT_PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32), (48, 48)],
        append_images=[master, im48],
    )

    render_mark_rgba(64, on_black=True).save(OUT_BRAND / "shiftboi-mark-64.png", "PNG")
    render_mark_rgba(512, on_black=True).save(OUT_BRAND / "shiftboi-mark.png", "PNG")


def load_font(size: int, *, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = []
    if bold:
        candidates += [
            Path("/System/Library/Fonts/Supplemental/Arial Bold.ttf"),
            Path("/Library/Fonts/Arial Bold.ttf"),
            Path("/System/Library/Fonts/Helvetica.ttc"),
        ]
    candidates += [
        Path("/System/Library/Fonts/Supplemental/Arial.ttf"),
        Path("/Library/Fonts/Arial.ttf"),
        Path("/System/Library/Fonts/Helvetica.ttc"),
        ROOT / "public" / "fonts" / "airmail.ttf",
    ]
    for path in candidates:
        if not path.exists():
            continue
        try:
            return ImageFont.truetype(str(path), size=size)
        except OSError:
            continue
    return ImageFont.load_default()


def build_og_card() -> Path:
    """1200×630 social card — dark field, violet bloom, mark + type."""
    W, H = 1200, 630
    base = Image.new("RGB", (W, H), hex_to_rgb(INK))

    bloom = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(bloom)
    cx, cy = int(W * 0.82), int(H * 0.22)
    for i, alpha in enumerate((48, 30, 16, 8)):
        r = 260 + i * 75
        bd.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*hex_to_rgb(VIOLET), alpha))
    bloom = bloom.filter(ImageFilter.GaussianBlur(90))
    base = Image.alpha_composite(base.convert("RGBA"), bloom).convert("RGB")
    draw = ImageDraw.Draw(base)

    m = 40
    draw.rectangle([m, m, W - m, H - m], outline=hex_to_rgb(HAIRLINE), width=1)
    tick = 20
    for x0, y0, dx, dy in (
        (m, m, 1, 1),
        (W - m, m, -1, 1),
        (m, H - m, 1, -1),
        (W - m, H - m, -1, -1),
    ):
        draw.line([(x0, y0), (x0 + dx * tick, y0)], fill=hex_to_rgb(VIOLET), width=2)
        draw.line([(x0, y0), (x0, y0 + dy * tick)], fill=hex_to_rgb(VIOLET), width=2)

    mark_size = 176
    mark = render_mark_rgba(mark_size, on_black=True)
    mark_x, mark_y = 80, (H - mark_size) // 2
    base.paste(mark, (mark_x, mark_y), mark)
    draw = ImageDraw.Draw(base)

    font_title = load_font(74, bold=True)
    font_sub = load_font(30, bold=False)
    font_meta = load_font(22, bold=False)

    text_x = mark_x + mark_size + 52
    title = "ShiftBOi"
    tagline = "Full-stack Web & Mobile"
    meta = "Design  ·  Build  ·  Ship"

    tb = draw.textbbox((0, 0), title, font=font_title)
    title_h = tb[3] - tb[1]
    sb = draw.textbbox((0, 0), tagline, font=font_sub)
    sub_h = sb[3] - sb[1]
    block_h = title_h + 20 + sub_h + 36 + 24
    text_y = (H - block_h) // 2

    draw.text((text_x, text_y), title, font=font_title, fill=hex_to_rgb(PAPER))
    draw.text(
        (text_x, text_y + title_h + 20),
        tagline,
        font=font_sub,
        fill=hex_to_rgb(MUTED),
    )
    rule_y = text_y + title_h + 20 + sub_h + 22
    draw.rectangle([text_x, rule_y, text_x + 56, rule_y + 3], fill=hex_to_rgb(VIOLET))
    draw.text(
        (text_x, rule_y + 18),
        meta,
        font=font_meta,
        fill=hex_to_rgb(VIOLET_BRIGHT),
    )

    out = OUT_PUBLIC / "og.png"
    base.save(out, "PNG", optimize=True)
    base.save(OUT_BRAND / "og.png", "PNG", optimize=True)
    return out


def sync_public_brand_mark() -> None:
    src = OUT_BRAND / "shiftboi-mark-color.svg"
    (OUT_PUBLIC / "brand-mark.svg").write_text(src.read_text(encoding="utf-8"), encoding="utf-8")


def main() -> None:
    OUT_BRAND.mkdir(parents=True, exist_ok=True)
    emit_mark_svg(colored=False, filename="shiftboi-mark.svg")
    emit_mark_svg(colored=True, filename="shiftboi-mark-color.svg")
    emit_wordmark_svg()
    sync_public_brand_mark()
    save_icons()
    og = build_og_card()
    print("Wrote:")
    for p in sorted(OUT_BRAND.glob("shiftboi*")):
        print(" ", p.relative_to(ROOT))
    print(" ", og.relative_to(ROOT))
    print(" ", (OUT_PUBLIC / "brand-mark.svg").relative_to(ROOT))
    print(" ", (OUT_PUBLIC / "favicon.ico").relative_to(ROOT))


if __name__ == "__main__":
    main()
