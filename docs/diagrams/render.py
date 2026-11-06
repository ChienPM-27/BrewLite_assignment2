#!/usr/bin/env python3
"""
Python Script to render all PlantUML (.puml) files in docs to SVG (.svg)
using PlantUML deflate encoding and official PlantUML server rendering.
"""

import os
import sys
import zlib
import urllib.request

def plantuml_encode(plantuml_text: str) -> str:
    zlibbed = zlib.compress(plantuml_text.encode('utf-8'))[2:-4]
    mapping = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_"
    res = []
    for i in range(0, len(zlibbed), 3):
        b1 = zlibbed[i]
        b2 = zlibbed[i+1] if i+1 < len(zlibbed) else 0
        b3 = zlibbed[i+2] if i+2 < len(zlibbed) else 0
        c1 = b1 >> 2
        c2 = ((b1 & 0x3) << 4) | (b2 >> 4)
        c3 = ((b2 & 0xF) << 2) | (b3 >> 6)
        c4 = b3 & 0x3F
        res.append(mapping[c1])
        res.append(mapping[c2])
        if i+1 < len(zlibbed):
            res.append(mapping[c3])
        if i+2 < len(zlibbed):
            res.append(mapping[c4])
    return "".join(res)

def render_puml_to_svg(puml_path: str, svg_path: str):
    with open(puml_path, "r", encoding="utf-8") as f:
        content = f.read()
    encoded = plantuml_encode(content)
    url = f"http://www.plantuml.com/plantuml/svg/~1{encoded}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        svg_content = resp.read()
    with open(svg_path, "wb") as f:
        f.write(svg_content)
    print(f"  [OK] Rendered: {os.path.basename(puml_path)} -> {os.path.basename(svg_path)} ({len(svg_content)} bytes)")

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(script_dir, "..", ".."))
    docs_dir = os.path.join(root_dir, "docs")

    print(f"Searching for .puml files in: {docs_dir}")
    puml_files = []
    for root, _, files in os.walk(docs_dir):
        for f in files:
            if f.endswith(".puml"):
                puml_files.append(os.path.join(root, f))

    if not puml_files:
        print("No .puml files found.")
        return

    print(f"Found {len(puml_files)} file(s). Rendering...")
    for puml_path in puml_files:
        svg_path = os.path.splitext(puml_path)[0] + ".svg"
        try:
            render_puml_to_svg(puml_path, svg_path)
        except Exception as e:
            print(f"  [FAIL] Failed to render {puml_path}: {e}")

    print("All diagrams rendered successfully.")

if __name__ == "__main__":
    main()
