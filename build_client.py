"""Render lib/client.js from client.src.js with the wallpaper embedded.

The desktop shell answers dsh-app://app paths that look like files itself, so a
plain `/.../wall.jpg` URL never reaches the plugin's host route. Embedding the
photo as a data URL removes that dependency entirely.

Usage:  python build_client.py [image]
"""
import base64
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "client.src.js"
OUT = ROOT / "lib" / "client.js"
IMAGE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "assets" / "wall.jpg"
PLACEHOLDER = "__WALL_DATA_URL__"

raw = IMAGE.read_bytes()
data_url = "data:image/jpeg;base64," + base64.b64encode(raw).decode("ascii")

text = SRC.read_text(encoding="utf-8")
if PLACEHOLDER not in text:
    raise SystemExit(f"placeholder {PLACEHOLDER} missing from {SRC}")

OUT.write_text(text.replace(PLACEHOLDER, data_url), encoding="utf-8")
print(f"{IMAGE.name}: {len(raw)} bytes -> {OUT.name}: {OUT.stat().st_size} bytes")
