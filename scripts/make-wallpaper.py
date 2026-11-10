"""Generate the bundled default wallpaper (an abstract deep-sea gradient).

Everything here is procedural: no third-party artwork is redistributed with the
plugin. Run it to regenerate `assets/wall.jpg` (the build embeds that file into
`lib/client.js` as a data URL):

    python scripts/make-wallpaper.py

Requires numpy and Pillow.
"""
import numpy as np
from PIL import Image, ImageFilter

W, H = 2560, 1600
OUT = __file__.rsplit("scripts", 1)[0] + "assets/wall.jpg"

rng = np.random.default_rng(20261110)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
u = xx / (W - 1)
v = yy / (H - 1)


def gauss(cx, cy, sx, sy, rot=0.0):
    dx, dy = u - cx, v - cy
    if rot:
        c, s = np.cos(rot), np.sin(rot)
        dx, dy = dx * c - dy * s, dx * s + dy * c
    return np.exp(-((dx / sx) ** 2 + (dy / sy) ** 2))


# --- base: vertical deep-water gradient -------------------------------------
top = np.array([5, 14, 25], np.float32)
bottom = np.array([10, 28, 44], np.float32)
img = top[None, None, :] + (bottom - top)[None, None, :] * (v ** 0.85)[..., None]

# --- soft light fields ------------------------------------------------------
layers = [
    ((0.14, 0.10, 0.40, 0.50, -0.6), np.array([64, 148, 186])),
    ((0.74, 0.08, 0.34, 0.34, 0.4), np.array([42, 104, 146])),
    ((0.48, 0.58, 0.60, 0.46, 0.0), np.array([22, 70, 102])),
    ((0.88, 0.66, 0.28, 0.30, -0.3), np.array([54, 126, 160])),
    ((0.28, 0.90, 0.48, 0.26, 0.2), np.array([10, 36, 58])),
    ((0.62, 0.24, 0.18, 0.62, 1.1), np.array([34, 92, 126])),
]
for (cx, cy, sx, sy, rot), colour in layers:
    field = gauss(cx, cy, sx, sy, rot)[..., None] * 0.9
    img = img + (colour[None, None, :] - img) * field

# --- slanting caustic rays from above ---------------------------------------
rays = 0.0
for i in range(11):
    phase = rng.uniform(0, 6.28)
    k = rng.uniform(7, 17)
    amp = rng.uniform(0.45, 1.0)
    band = np.sin((u * 1.35 + v * 0.30) * k + phase) * 0.5 + 0.5
    band = band ** 2.2
    falloff = np.clip(1.0 - (u * 0.45 + (1.0 - v) * 1.05), 0, 1) ** 1.35
    rays = rays + band * falloff * amp
rays = np.clip(rays / 11.0 * 3.2, 0, 1)[..., None]
img = img + rays * np.array([46, 104, 132], np.float32)

# --- one broad shaft of light from the upper left ---------------------------------
shaft = np.clip(np.sin((u * 2.6 + v * 0.5) * 3.14159 * 0.9 + 0.6), 0, 1) ** 3
shaft = shaft * np.clip(1.0 - (u * 0.9 + (1.0 - v) * 0.7), 0, 1) ** 1.2
img = img + (shaft * 0.55)[..., None] * np.array([70, 140, 170], np.float32)

# --- warm counter-light, very low -------------------------------------------------
warm = gauss(0.78, 0.82, 0.30, 0.30)[..., None] * 0.05
img = img + warm * np.array([120, 90, 56], np.float32)

# --- vignette ---------------------------------------------------------------
rad = np.sqrt((u - 0.5) ** 2 * 1.15 + (v - 0.5) ** 2 * 0.85)
vig = np.clip(1.0 - (rad / 0.80) ** 2.1, 0.35, 1.0)[..., None]
img = img * vig

# --- grain ------------------------------------------------------------------
img = img + rng.normal(0, 2.4, (H, W, 1)).astype(np.float32)

img = np.clip(img, 0, 255).astype(np.uint8)
out = Image.fromarray(img, "RGB")
# one gentle pass: keeps the fields smooth without erasing the grain
out = out.filter(ImageFilter.GaussianBlur(0.6))
out.save(OUT, "JPEG", quality=86, optimize=True, progressive=True)
print(f"{OUT}: {W}x{H}")
