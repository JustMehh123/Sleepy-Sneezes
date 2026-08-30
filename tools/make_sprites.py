#!/usr/bin/env python3
"""Bake pixel-art sprite sheets for Sleepy Sneezes."""
import zlib, struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

def png(path, w, h, pixels):
    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)
    raw = b""
    for y in range(h):
        raw += b"\x00"
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes((r, g, b, a))
    ihdr = struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)
    data = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    path.write_bytes(data)

def canvas(w, h):
    return [ (0, 0, 0, 0) ] * (w * h), w, h

def put(px, w, h, x, y, color, rw=1, rh=1):
    if len(color) == 3:
        color = (*color, 255)
    for yy in range(y, y + rh):
        for xx in range(x, x + rw):
            if 0 <= xx < w and 0 <= yy < h:
                px[yy * w + xx] = color

W = {
    "white": (248, 250, 252),
    "white2": (226, 232, 240),
    "blush": (254, 205, 211),
    "ink": (15, 23, 42),
    "mouth": (159, 18, 57),
    "indigo": (79, 70, 229),
    "indigoL": (129, 140, 248),
    "indigoD": (55, 48, 163),
    "indigoM": (99, 102, 241),
    "lavender": (196, 181, 253),
    "gold": (253, 224, 138),
    "gold2": (250, 204, 21),
    "slipper": (49, 46, 129),
    "slipperL": (165, 180, 252),
    "outline": (30, 27, 75),
}

def draw_player(px, w, h, ox, oy, frame):
    # frame: 0 idle, 1 walkA, 2 walkB, 3 jump, 4 dash, 5 charge
    walk = 0
    if frame == 1:
        walk = 2
    elif frame == 2:
        walk = -2
    flap = 4 if frame in (3, 4) else 0
    # slippers
    put(px, w, h, ox + 6 + walk, oy + 35, W["slipper"], 9, 5)
    put(px, w, h, ox + 17 - walk, oy + 35, W["slipper"], 9, 5)
    put(px, w, h, ox + 6 + walk, oy + 35, W["slipperL"], 9, 2)
    put(px, w, h, ox + 17 - walk, oy + 35, W["slipperL"], 9, 2)
    # legs
    put(px, w, h, ox + 8 + walk, oy + 28, W["white"], 6, 8)
    put(px, w, h, ox + 18 - walk, oy + 28, W["white"], 6, 8)
    # robe
    put(px, w, h, ox + 4, oy + 16, W["indigo"], 24, 16)
    put(px, w, h, ox + 4, oy + 16, W["indigoL"], 24, 4)
    put(px, w, h, ox + 4, oy + 28, W["indigoD"], 24, 4)
    # moon
    put(px, w, h, ox + 8, oy + 20, W["gold"], 5, 5)
    put(px, w, h, ox + 9, oy + 19, W["gold"], 3, 7)
    put(px, w, h, ox + 7, oy + 21, W["gold"], 7, 3)
    put(px, w, h, ox + 20, oy + 24, W["lavender"], 3, 3)
    put(px, w, h, ox + 17, oy + 27, W["lavender"], 2, 2)
    # sash
    put(px, w, h, ox + 4, oy + 25, W["lavender"], 24, 3)
    put(px, w, h, ox + 14, oy + 25, W["gold"], 4, 3)
    # sleeves / hands
    if frame == 5:
        put(px, w, h, ox + 24, oy + 8, W["indigo"], 7, 12)
        put(px, w, h, ox + 1, oy + 8, W["indigo"], 7, 12)
        put(px, w, h, ox + 25, oy + 4, W["white"], 6, 6)
        put(px, w, h, ox + 1, oy + 4, W["white"], 6, 6)
    elif frame == 4:
        put(px, w, h, ox + 26, oy + 14, W["indigo"], 10, 7)
        put(px, w, h, ox + 0, oy + 18, W["indigo"], 8, 6)
        put(px, w, h, ox + 34, oy + 14, W["white"], 5, 5)
        put(px, w, h, ox + 0, oy + 18, W["white"], 5, 5)
    else:
        put(px, w, h, ox + 26, oy + 17 + flap, W["indigo"], 7, 7)
        put(px, w, h, ox + 0, oy + 18 - flap, W["indigo"], 7, 7)
        put(px, w, h, ox + 30, oy + 19 + flap, W["white"], 5, 5)
        put(px, w, h, ox + 0, oy + 19 - flap, W["white"], 5, 5)
    # head
    put(px, w, h, ox + 6, oy + 4, W["outline"], 20, 16)
    put(px, w, h, ox + 7, oy + 5, W["white"], 18, 14)
    put(px, w, h, ox + 7, oy + 15, W["white2"], 18, 4)
    put(px, w, h, ox + 8, oy + 12, W["blush"], 4, 2)
    put(px, w, h, ox + 20, oy + 12, W["blush"], 4, 2)
    put(px, w, h, ox + 13, oy + 16, W["mouth"], 6, 2)
    # eyes
    if frame in (4, 5):
        put(px, w, h, ox + 9, oy + 8, W["ink"], 5, 2)
        put(px, w, h, ox + 18, oy + 8, W["ink"], 5, 2)
    else:
        put(px, w, h, ox + 9, oy + 9, W["ink"], 2, 2)
        put(px, w, h, ox + 11, oy + 8, W["ink"], 4, 2)
        put(px, w, h, ox + 15, oy + 9, W["ink"], 2, 2)
        put(px, w, h, ox + 17, oy + 9, W["ink"], 2, 2)
        put(px, w, h, ox + 19, oy + 8, W["ink"], 4, 2)
        put(px, w, h, ox + 23, oy + 9, W["ink"], 2, 2)
    # hat matching robe indigo
    put(px, w, h, ox + 5, oy + 1, W["indigoD"], 22, 7)
    put(px, w, h, ox + 7, oy + 0, W["indigoM"], 16, 5)
    put(px, w, h, ox + 5, oy + 5, W["indigoL"], 22, 2)
    put(px, w, h, ox + 0, oy + 0, W["indigoD"], 8, 6)
    put(px, w, h, ox + 0, oy + 0, W["gold2"], 6, 6)
    put(px, w, h, ox + 1, oy + 1, W["white"], 3, 3)

def sheet_player():
    fw, fh, n = 40, 44, 6
    px, w, h = canvas(fw * n, fh)
    for i in range(n):
        draw_player(px, w, h, i * fw, 2, i)
    png(OUT / "player.png", w, h, px)

def rect(px, w, h, x, y, rw, rh, c):
    put(px, w, h, x, y, c, rw, rh)

def sheet_enemies():
    # 8 types, 32x32
    names = ["bunny", "slime", "fox", "moth", "bat", "ogre", "scarecrow", "clockling"]
    fw, fh = 32, 32
    px, w, h = canvas(fw * len(names), fh)
    # bunny
    x = 0
    rect(px, w, h, x+4, 12, 24, 16, (148, 163, 184))
    rect(px, w, h, x+7, 14, 18, 12, (226, 232, 240))
    rect(px, w, h, x+6, 2, 5, 12, (100, 116, 139))
    rect(px, w, h, x+18, 2, 5, 12, (100, 116, 139))
    rect(px, w, h, x+7, 4, 3, 8, (253, 164, 175))
    rect(px, w, h, x+19, 4, 3, 8, (253, 164, 175))
    rect(px, w, h, x+16, 18, 5, 5, (244, 63, 94))
    # slime
    x = 32
    rect(px, w, h, x+4, 12, 24, 16, (21, 128, 61))
    rect(px, w, h, x+8, 16, 16, 8, (74, 222, 128))
    rect(px, w, h, x+10, 14, 6, 4, (187, 247, 208))
    rect(px, w, h, x+10, 18, 3, 3, (5, 46, 22))
    rect(px, w, h, x+18, 18, 3, 3, (5, 46, 22))
    # fox
    x = 64
    rect(px, w, h, x+4, 14, 22, 12, (234, 88, 12))
    rect(px, w, h, x+22, 10, 10, 8, (234, 88, 12))
    rect(px, w, h, x+6, 6, 5, 8, (154, 52, 18))
    rect(px, w, h, x+14, 6, 5, 8, (154, 52, 18))
    rect(px, w, h, x+8, 20, 10, 4, (255, 247, 237))
    rect(px, w, h, x+24, 12, 3, 3, (17, 17, 17))
    # moth
    x = 96
    rect(px, w, h, x+0, 10, 14, 14, (252, 231, 243))
    rect(px, w, h, x+18, 10, 14, 14, (252, 231, 243))
    rect(px, w, h, x+2, 14, 8, 8, (219, 39, 119))
    rect(px, w, h, x+22, 14, 8, 8, (219, 39, 119))
    rect(px, w, h, x+12, 14, 8, 12, (251, 191, 36))
    rect(px, w, h, x+13, 8, 2, 8, (120, 53, 15))
    rect(px, w, h, x+17, 8, 2, 8, (120, 53, 15))
    # bat
    x = 128
    rect(px, w, h, x+0, 12, 12, 6, (30, 27, 75))
    rect(px, w, h, x+20, 12, 12, 6, (30, 27, 75))
    rect(px, w, h, x+10, 10, 12, 14, (76, 29, 149))
    rect(px, w, h, x+12, 14, 3, 3, (244, 63, 94))
    rect(px, w, h, x+18, 14, 3, 3, (244, 63, 94))
    # ogre
    x = 160
    rect(px, w, h, x+4, 10, 24, 20, (22, 101, 52))
    rect(px, w, h, x+8, 14, 16, 12, (74, 222, 128))
    rect(px, w, h, x+2, 6, 8, 8, (20, 83, 45))
    rect(px, w, h, x+22, 6, 8, 8, (20, 83, 45))
    rect(px, w, h, x+4, 8, 4, 4, (254, 240, 138))
    rect(px, w, h, x+24, 8, 4, 4, (254, 240, 138))
    rect(px, w, h, x+10, 22, 12, 4, (127, 29, 29))
    # scarecrow
    x = 192
    rect(px, w, h, x+14, 12, 4, 18, (120, 53, 15))
    rect(px, w, h, x+4, 16, 24, 8, (202, 138, 4))
    rect(px, w, h, x+10, 4, 12, 12, (254, 243, 199))
    rect(px, w, h, x+8, 2, 16, 4, (124, 45, 18))
    rect(px, w, h, x+12, 8, 3, 3, (17, 17, 17))
    rect(px, w, h, x+18, 8, 3, 3, (17, 17, 17))
    # clockling
    x = 224
    rect(px, w, h, x+6, 10, 20, 18, (161, 98, 7))
    rect(px, w, h, x+9, 13, 14, 12, (253, 230, 138))
    rect(px, w, h, x+15, 15, 2, 8, (120, 53, 15))
    rect(px, w, h, x+15, 19, 6, 2, (120, 53, 15))
    rect(px, w, h, x+4, 4, 8, 8, (180, 83, 9))
    rect(px, w, h, x+20, 4, 8, 8, (180, 83, 9))
    png(OUT / "enemies.png", w, h, px)

def sheet_tiles():
    fw = 16
    kinds = 8
    px, w, h = canvas(fw * kinds, fw)
    # 0 grass top
    rect(px, w, h, 0, 0, 16, 16, (28, 25, 23))
    rect(px, w, h, 0, 0, 16, 5, (54, 83, 20))
    rect(px, w, h, 0, 0, 16, 2, (77, 124, 15))
    # 1 dirt
    rect(px, w, h, 16, 0, 16, 16, (68, 64, 60))
    rect(px, w, h, 18, 4, 4, 3, (87, 83, 78))
    # 2 platform
    rect(px, w, h, 32, 0, 16, 16, (51, 65, 85))
    rect(px, w, h, 32, 0, 16, 4, (134, 239, 172))
    # 3 spikes
    rect(px, w, h, 48, 10, 16, 6, (2, 6, 23))
    for s in range(4):
        rect(px, w, h, 49 + s * 4, 4, 3, 8, (251, 113, 133))
        rect(px, w, h, 50 + s * 4, 2, 1, 3, (254, 205, 211))
    # 4 pillow
    rect(px, w, h, 64, 4, 16, 12, (2, 132, 199))
    rect(px, w, h, 64, 4, 16, 3, (125, 211, 252))
    rect(px, w, h, 70, 9, 4, 4, (254, 240, 138))
    # 5 clock
    rect(px, w, h, 80, 0, 16, 16, (245, 158, 11))
    rect(px, w, h, 83, 3, 10, 10, (255, 255, 255))
    rect(px, w, h, 87, 5, 2, 5, (15, 23, 42))
    # 6 goal
    rect(px, w, h, 96, 0, 16, 16, (56, 189, 248))
    rect(px, w, h, 100, 4, 8, 8, (255, 255, 255))
    # 7 moon
    rect(px, w, h, 112, 2, 12, 12, (254, 240, 138))
    png(OUT / "tiles.png", w, h, px)

def sheet_boss():
    px, w, h = canvas(110, 90)
    rect(px, w, h, 20, 8, 70, 18, (251, 191, 36))
    rect(px, w, h, 10, 14, 20, 16, (251, 191, 36))
    rect(px, w, h, 80, 14, 20, 16, (251, 191, 36))
    rect(px, w, h, 5, 24, 100, 50, (79, 70, 229))
    rect(px, w, h, 22, 32, 66, 32, (15, 23, 42))
    rect(px, w, h, 30, 40, 16, 12, (244, 63, 94))
    rect(px, w, h, 64, 40, 16, 12, (244, 63, 94))
    rect(px, w, h, 34, 44, 6, 6, (254, 240, 138))
    rect(px, w, h, 68, 44, 6, 6, (254, 240, 138))
    png(OUT / "boss.png", w, h, px)

if __name__ == "__main__":
    sheet_player()
    sheet_enemies()
    sheet_tiles()
    sheet_boss()
    print("wrote", list(OUT.iterdir()))
