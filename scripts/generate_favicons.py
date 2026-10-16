#!/usr/bin/env python3
"""
scripts/generate_favicons.py
Generates high-definition branded favicons and app icons for Se55o Mantrico
using the authentic circular meditating soccer Buddha master emblem from images/favicon_raw.jpeg:
- favicon.ico, favicon.png, favicon-32x32.png, favicon-64x64.png
- favicon-192x192.png, favicon-512x512.png, maskable variants
- apple-touch-icon.png (180x180)
- favicon.svg
- preview.png (1200x630 social share card)
"""

from PIL import Image, ImageDraw, ImageFont
import base64
import math
import os

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")
IMAGES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "images")

def extract_master_badge():
    """
    Extracts the circular badge from images/favicon_raw.jpeg,
    applying 4x supersampled anti-aliased alpha masking to isolate
    the circular gold-rimmed medallion with 0% background artifacts.
    """
    raw_path = os.path.join(IMAGES_DIR, "favicon_raw.jpeg")
    raw = Image.open(raw_path).convert("RGBA")
    w, h = raw.size

    # Calibrated circle center & radius (sits squarely on the warm outer gold rim)
    scale = 4
    cx = 511.5 * scale
    cy = 521.5 * scale
    r = 459.0 * scale

    mask = Image.new("L", (w * scale, h * scale), 0)
    draw = ImageDraw.Draw(mask)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=255)
    mask = mask.resize((w, h), Image.Resampling.LANCZOS)

    raw.putalpha(mask)

    # Crop tightly to the badge disc
    box = (int(511.5 - 460), int(521.5 - 460), int(511.5 + 460), int(521.5 + 460))
    badge = raw.crop(box)
    return badge


def get_emblem(master_badge, size=512, is_maskable=False):
    """
    Scales the master emblem to the requested size with proper padding & background.
    """
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    if is_maskable:
        # Fill background with dark navy/obsidian
        draw = ImageDraw.Draw(canvas)
        draw.rectangle([0, 0, size, size], fill=(9, 13, 22, 255))
        # Maskable safe-zone: badge size 80% of canvas
        inner_size = int(size * 0.80)
        badge_resized = master_badge.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        offset = (size - inner_size) // 2
        canvas.paste(badge_resized, (offset, offset), badge_resized)
    else:
        # Standard icon: badge fits nicely with slight optical margin (95% of canvas)
        inner_size = int(size * 0.95)
        badge_resized = master_badge.resize((inner_size, inner_size), Image.Resampling.LANCZOS)
        offset = (size - inner_size) // 2
        canvas.paste(badge_resized, (offset, offset), badge_resized)
    return canvas


def draw_social_preview(master_badge, width=1200, height=630):
    """
    Renders the 1200x630 OpenGraph social share card with the master emblem.
    """
    img = Image.new("RGBA", (width, height), (10, 15, 29, 255))

    # Feathered warm golden glow behind emblem
    glow = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    badge_cx, badge_cy = 290, 315
    for r_glow in range(320, 180, -4):
        alpha = int(24 * (1.0 - (r_glow - 180) / 140.0))
        glow_draw.ellipse([badge_cx - r_glow, badge_cy - r_glow, badge_cx + r_glow, badge_cy + r_glow], fill=(245, 158, 11, alpha))

    img = Image.alpha_composite(img, glow)
    draw = ImageDraw.Draw(img)

    # Subtle card border
    draw.rectangle([0, 0, width, height], outline=(245, 158, 11, 70), width=3)

    # Left: High-Res Master Emblem (450x450)
    badge_size = 450
    emblem = master_badge.resize((badge_size, badge_size), Image.Resampling.LANCZOS)
    img.paste(emblem, (65, int((height - badge_size) / 2)), emblem)

    # Right: Typography
    font_bold = None
    font_sub = None
    font_small = None
    font_kicker = None
    for font_name in ["Arial Bold.ttf", "HelveticaNeue.ttc", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        try:
            font_bold = ImageFont.truetype(font_name, 68)
            font_sub = ImageFont.truetype(font_name, 32)
            font_small = ImageFont.truetype(font_name, 19)
            font_kicker = ImageFont.truetype(font_name, 21)
            break
        except Exception:
            continue

    if not font_bold:
        font_bold = ImageFont.load_default()
        font_sub = font_bold
        font_small = font_bold
        font_kicker = font_bold

    x_content = 560

    # Header kicker
    draw.text((x_content, 120), "LEGA MANTRA • FANTACALCIO", font=font_kicker, fill=(245, 158, 11, 240))
    # Main Title
    draw.text((x_content, 158), "Se55o Mantrico", font=font_bold, fill=(255, 255, 255, 255))
    # Subtitle
    draw.text((x_content, 248), "Sala Trofei & Albo d'Oro Storico", font=font_sub, fill=(251, 191, 36, 255))
    
    # Feature Badges Rows
    features_rows = [
        ["4 Stagioni Ufficiali", "Scudetto & Coppe", "Cucchiaio"],
        ["Tavolo dei Rivali", "H2H & Nemesi Matrix"],
        ["Social Story (9:16)", "Econometria SPI & Rischio"]
    ]
    cur_y = 315
    for row in features_rows:
        x_pos = x_content
        for f in row:
            bbox = draw.textbbox((0, 0), f, font=font_small)
            bw = bbox[2] - bbox[0] + 20
            draw.rounded_rectangle([x_pos, cur_y, x_pos + bw, cur_y + 30], radius=6, fill=(20, 29, 47, 255), outline=(51, 65, 85, 255), width=1)
            draw.text((x_pos + 10, cur_y + 5), f, font=font_small, fill=(226, 232, 240, 255))
            x_pos += bw + 10
        cur_y += 38

    # Decorative separator line
    draw.line([(x_content, 455), (width - 70, 455)], fill=(51, 65, 85, 180), width=1)

    # Footer note
    draw.text((x_content, 475), "Archivio Storico Ufficiale", font=font_small, fill=(148, 163, 184, 230))
    draw.text((x_content, 505), "fgizzarellids.github.io/lega_mantra_sm_sala_trofei", font=font_small, fill=(245, 158, 11, 230))

    return img


def main():
    print("[INFO] Extracting master emblem from images/favicon_raw.jpeg...")
    master_badge = extract_master_badge()
    print(f"  [OK] Master badge extracted ({master_badge.size[0]}x{master_badge.size[1]})")

    # 1. Base sizes
    sizes = [
        ("favicon-32x32.png", 32, False),
        ("favicon-64x64.png", 64, False),
        ("favicon-192x192.png", 192, False),
        ("favicon-512x512.png", 512, False),
        ("apple-touch-icon.png", 180, False),
        ("favicon.png", 192, False),
        ("favicon-192x192-maskable.png", 192, True),
        ("favicon-512x512-maskable.png", 512, True),
    ]

    for filename, size, maskable in sizes:
        target_path = os.path.join(PUBLIC_DIR, filename)
        icon_img = get_emblem(master_badge, size=size, is_maskable=maskable)
        icon_img.save(target_path, "PNG", optimize=True)
        print(f"  [OK] Saved {filename} ({size}x{size})")

    # 2. Multi-resolution favicon.ico
    ico_img = get_emblem(master_badge, size=64, is_maskable=False)
    ico_path = os.path.join(PUBLIC_DIR, "favicon.ico")
    ico_img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("  [OK] Saved favicon.ico (16, 32, 48, 64)")

    # 3. Vector SVG favicon embedding base64 high-res PNG
    png_512_path = os.path.join(PUBLIC_DIR, "favicon-512x512.png")
    with open(png_512_path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,{b64}" width="512" height="512"/>
</svg>
'''
    svg_path = os.path.join(PUBLIC_DIR, "favicon.svg")
    with open(svg_path, "w", encoding="utf-8") as f:
        f.write(svg_content)
    print("  [OK] Saved favicon.svg")

    # 4. Social preview card
    preview_img = draw_social_preview(master_badge, 1200, 630)
    preview_path = os.path.join(PUBLIC_DIR, "preview.png")
    preview_img.convert("RGB").save(preview_path, "PNG", optimize=True)
    print("  [OK] Saved preview.png (1200x630)")

    # Clean up test files if present
    for tf in ["public/assets/test_transparent_badge.png", "public/assets/test_badge_clean.png"]:
        p = os.path.join(os.path.dirname(os.path.dirname(__file__)), tf)
        if os.path.exists(p):
            os.remove(p)

    print("[SUCCESS] All Se55o Mantrico visual branding assets generated successfully!")

if __name__ == "__main__":
    main()
