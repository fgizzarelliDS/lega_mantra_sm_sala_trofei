#!/usr/bin/env python3
"""
Generates high-definition branded favicons and app icons for Se55o Mantrico:
- favicon.ico, favicon.png, favicon-32x32.png, favicon-64x64.png
- favicon-192x192.png, favicon-512x512.png, maskable variants
- apple-touch-icon.png (180x180)
- preview.png (1200x630 social share card)
"""

from PIL import Image, ImageDraw, ImageFont
import math
import os

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "public")

def draw_emblem(size=512, is_maskable=False):
    """
    Renders an elegant gold/amber heraldic badge on deep obsidian navy with monogram 'SM'
    """
    # Create high-res canvas (supersampled 2x for ultra-sharp downscaling)
    scale = 2
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = canvas_size / 2.0
    
    # Safe radius (maskable requires 80% inner content)
    radius_ratio = 0.40 if is_maskable else 0.46
    r = canvas_size * radius_ratio

    # Background circle/disc
    bg_color = (15, 23, 42, 255)  # slate-900 / obsidian
    draw.ellipse([center - r, center - r, center + r, center + r], fill=bg_color)

    # Outer Gold Rim
    rim_width = int(14 * (size / 512.0) * scale)
    draw.ellipse([center - r, center - r, center + r, center + r], outline=(245, 158, 11, 255), width=rim_width)

    # Inner Gold Inset Ring
    inner_r = r - int(18 * (size / 512.0) * scale)
    inner_width = int(4 * (size / 512.0) * scale)
    draw.ellipse([center - inner_r, center - inner_r, center + inner_r, center + inner_r], outline=(252, 211, 77, 200), width=inner_width)

    # Laurel Wreath Accent Dots around the rim
    num_dots = 16
    dot_radius = int(6 * (size / 512.0) * scale)
    ring_radius = (r + inner_r) / 2.0
    for i in range(num_dots):
        angle = (2 * math.pi / num_dots) * i
        dx = center + ring_radius * math.cos(angle)
        dy = center + ring_radius * math.sin(angle)
        draw.ellipse([dx - dot_radius, dy - dot_radius, dx + dot_radius, dy + dot_radius], fill=(251, 191, 36, 230))

    # Center Monogram: "SM"
    # Find a bold serif or sans font available on macOS, else default
    font_size = int(175 * (size / 512.0) * scale)
    font = None
    for font_name in ["Arial Bold.ttf", "HelveticaNeue.ttc", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf"]:
        try:
            font = ImageFont.truetype(font_name, font_size)
            break
        except Exception:
            continue
    if not font:
        font = ImageFont.load_default()

    text = "SM"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # Vertically offset slightly below center to leave room for a crown/trophy
    text_x = center - (text_w / 2.0) - bbox[0]
    text_y = center - (text_h / 2.0) - bbox[1] + int(12 * (size / 512.0) * scale)

    # Draw subtle text shadow
    shadow_offset = int(4 * (size / 512.0) * scale)
    draw.text((text_x + shadow_offset, text_y + shadow_offset), text, font=font, fill=(0, 0, 0, 180))
    # Draw gold text
    draw.text((text_x, text_y), text, font=font, fill=(253, 224, 71, 255))

    # Top Crown / 3-Star Motif
    star_y = center - r + int(48 * (size / 512.0) * scale)
    star_spacing = int(34 * (size / 512.0) * scale)
    for offset_idx, dy_adj in [(-1, 6), (0, 0), (1, 6)]:
        sx = center + offset_idx * star_spacing
        sy = star_y + dy_adj * (size / 512.0) * scale
        sr = int(8 * (size / 512.0) * scale)
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(251, 191, 36, 255))

    # Downsample with Lanczos for anti-aliased finish
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img


def draw_social_preview(width=1200, height=630):
    """
    Renders the 1200x630 OpenGraph social share card
    """
    img = Image.new("RGBA", (width, height), (11, 15, 25, 255))
    draw = ImageDraw.Draw(img)

    # Decorative background mesh/glow
    center_glow = (245, 158, 11, 28)
    draw.ellipse([width * 0.1, -100, width * 0.9, height + 100], fill=center_glow)
    draw.rectangle([0, 0, width, height], outline=(245, 158, 11, 100), width=4)

    # Left: Emblem
    emblem = draw_emblem(size=380, is_maskable=False)
    img.paste(emblem, (80, int((height - 380) / 2)), emblem)

    # Right: Typography
    font_bold = None
    font_sub = None
    font_small = None
    for font_name in ["Arial Bold.ttf", "HelveticaNeue.ttc", "/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"]:
        try:
            font_bold = ImageFont.truetype(font_name, 72)
            font_sub = ImageFont.truetype(font_name, 38)
            font_small = ImageFont.truetype(font_name, 24)
            break
        except Exception:
            continue

    if not font_bold:
        font_bold = ImageFont.load_default()
        font_sub = font_bold
        font_small = font_bold

    # Header kicker
    draw.text((500, 150), "LEGA MANTRA • FANTACALCIO", font=font_small, fill=(245, 158, 11, 230))
    # Main Title
    draw.text((500, 195), "Se55o Mantrico", font=font_bold, fill=(255, 255, 255, 255))
    # Subtitle
    draw.text((500, 290), "Sala Trofei & Albo d'Oro Storico", font=font_sub, fill=(251, 191, 36, 255))
    
    # Feature Badges
    badges_y = 370
    features = ["🏆 4 Stagioni Ufficiali", "🥇 Scudetto", "🥈 Coppa", "⭐ Supercoppa", "🥄 Cucchiaio"]
    x_pos = 500
    for f in features:
        bbox = draw.textbbox((0, 0), f, font=font_small)
        bw = bbox[2] - bbox[0] + 24
        draw.rounded_rectangle([x_pos, badges_y, x_pos + bw, badges_y + 40], radius=8, fill=(30, 41, 59, 255), outline=(51, 65, 85, 255), width=1)
        draw.text((x_pos + 12, badges_y + 8), f, font=font_small, fill=(226, 232, 240, 255))
        x_pos += bw + 12
        if x_pos > 1100:
            x_pos = 500
            badges_y += 50

    # Footer note
    draw.text((500, 480), "Archivio Ufficiale Storico • fgizzarellids.github.io/lega_mantra_sm_sala_trofei", font=font_small, fill=(148, 163, 184, 200))

    return img


def main():
    print("[INFO] Generating Se55o Mantrico favicons & visual assets...")
    
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
        icon_img = draw_emblem(size=size, is_maskable=maskable)
        icon_img.save(target_path, "PNG", optimize=True)
        print(f"  [OK] Saved {filename} ({size}x{size})")

    # 2. Multi-resolution favicon.ico
    ico_img = draw_emblem(size=64, is_maskable=False)
    ico_path = os.path.join(PUBLIC_DIR, "favicon.ico")
    ico_img.save(ico_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    print("  [OK] Saved favicon.ico (16, 32, 48, 64)")

    # 3. Social preview card
    preview_img = draw_social_preview(1200, 630)
    preview_path = os.path.join(PUBLIC_DIR, "preview.png")
    preview_img.convert("RGB").save(preview_path, "PNG", optimize=True)
    print("  [OK] Saved preview.png (1200x630)")

    print("[SUCCESS] All Se55o Mantrico visual branding assets generated successfully!")

if __name__ == "__main__":
    main()
