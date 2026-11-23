"""Generate "Strážmajster Paťo" v2 — the buff, grumpy calorie cop.

Usage:  python3 design/gen_mascot_v2.py public

Writes  <out>/mascot/{grumpy,watching,angry,approve,arrest}.svg  and  <out>/icon.svg.
All poses share one 200x200 bust framing (head + cap on top, shoulders/chest
cropped by the bottom edge), thick ink outlines, flat fills from tokens.css.

Outline trick: limbs are unions of tapered capsules. `blob()` draws every piece
once fat in ink (the outline) and once in fill on top, so the union gets a single
clean outer contour with no seams between the pieces.
"""
import math, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else "public"

# ---- palette (tokens.css) -------------------------------------------------
INK = "#1E2446"
BLUE = "#3B5BF6"
BLUE_HI = "#5572FF"
BLUE_LIP = "#2A40C2"
SIREN = "#FF4F64"
SIREN_LIP = "#D42F48"
GOLD = "#FFC21A"
GOLD_LIP = "#D99A00"
MOUTH = "#6B1A22"
TONGUE = "#FF8A9A"
WHITE = "#FFFFFF"
# mascot-specific
SKIN = "#F59B73"        # ruddy, slightly tomato-ish tan
SKIN_SH = "#D97B52"
SKIN_HI = "#FFBE98"
RAGE = "#FF5B45"        # --kp-tomato: he literally turns into a tomato
RAGE_SH = "#E3412D"
RAGE_HI = "#FF8A70"
HAIR = "#3A2620"
STEEL = "#DDE2EE"
STEEL_SH = "#A9B0C6"
LENS_TOP = "#BFE3FF"
LENS_BOT = "#4F7BFF"
STEAM = "#FFFFFF"

W = 4  # base outline width (200-unit space)


# ---- primitives -----------------------------------------------------------
def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def capsule(x1, y1, r1, x2, y2, r2):
    """Convex hull of two circles (a tapered limb segment) as an SVG path."""
    dx, dy = x2 - x1, y2 - y1
    d = math.hypot(dx, dy)
    if d <= abs(r1 - r2) + 0.01:  # one circle swallows the other
        x, y, r = (x1, y1, r1) if r1 >= r2 else (x2, y2, r2)
        return circle_d(x, y, r)
    a = math.atan2(dy, dx)
    t = math.acos((r1 - r2) / d)
    p = lambda cx, cy, r, ang: (cx + r * math.cos(ang), cy + r * math.sin(ang))
    a1 = p(x1, y1, r1, a + t)
    b1 = p(x2, y2, r2, a + t)
    b2 = p(x2, y2, r2, a - t)
    a2 = p(x1, y1, r1, a - t)
    large2 = 1 if 2 * t > math.pi else 0
    large1 = 1 if (2 * math.pi - 2 * t) > math.pi else 0
    return (f"M{f(a1[0])} {f(a1[1])} L{f(b1[0])} {f(b1[1])} "
            f"A{f(r2)} {f(r2)} 0 {large2} 0 {f(b2[0])} {f(b2[1])} "
            f"L{f(a2[0])} {f(a2[1])} "
            f"A{f(r1)} {f(r1)} 0 {large1} 0 {f(a1[0])} {f(a1[1])}Z")


def chain(*pts):
    """Limb through (x, y, r) joints -> list of capsule paths."""
    return [capsule(*pts[i], *pts[i + 1]) for i in range(len(pts) - 1)]


def circle_d(cx, cy, r):
    return (f"M{f(cx - r)} {f(cy)} A{f(r)} {f(r)} 0 1 0 {f(cx + r)} {f(cy)} "
            f"A{f(r)} {f(r)} 0 1 0 {f(cx - r)} {f(cy)}Z")


def rrect_d(x, y, w, h, r):
    return (f"M{f(x + r)} {f(y)} H{f(x + w - r)} Q{f(x + w)} {f(y)} {f(x + w)} {f(y + r)} "
            f"V{f(y + h - r)} Q{f(x + w)} {f(y + h)} {f(x + w - r)} {f(y + h)} "
            f"H{f(x + r)} Q{f(x)} {f(y + h)} {f(x)} {f(y + h - r)} "
            f"V{f(y + r)} Q{f(x)} {f(y)} {f(x + r)} {f(y)}Z")


def star(cx, cy, ro, ri, rot=-90):
    pts = []
    for i in range(10):
        r = ro if i % 2 == 0 else ri
        a = math.radians(rot + i * 36)
        pts.append(f"{f(cx + r * math.cos(a))} {f(cy + r * math.sin(a))}")
    return "M" + " L".join(pts) + "Z"


def sparkle(cx, cy, s):
    return (f"M{f(cx)} {f(cy - s)} Q{f(cx + s * .18)} {f(cy - s * .18)} {f(cx + s)} {f(cy)} "
            f"Q{f(cx + s * .18)} {f(cy + s * .18)} {f(cx)} {f(cy + s)} "
            f"Q{f(cx - s * .18)} {f(cy + s * .18)} {f(cx - s)} {f(cy)} "
            f"Q{f(cx - s * .18)} {f(cy - s * .18)} {f(cx)} {f(cy - s)}Z")


def path(d, fill="none", stroke=INK, sw=W, extra=""):
    s = f' stroke="{stroke}" stroke-width="{f(sw)}" stroke-linejoin="round" stroke-linecap="round"' if stroke else ""
    return f'<path d="{d}" fill="{fill}"{s}{extra}/>'


def line(d, sw=W, color=INK, extra=""):
    return path(d, "none", color, sw, extra)


def blob(ds, fill, sw=W, extra=""):
    """Union of shapes with a single outer outline."""
    if isinstance(ds, str):
        ds = [ds]
    o = "".join(f'<path d="{d}"/>' for d in ds)
    return (f'<g fill="{INK}" stroke="{INK}" stroke-width="{f(sw * 2)}" stroke-linejoin="round"{extra}>{o}</g>'
            f'<g fill="{fill}"{extra}>{o}</g>')


def g(content, transform=None, extra=""):
    t = f' transform="{transform}"' if transform else ""
    body = content if isinstance(content, str) else "".join(content)
    return f"<g{t}{extra}>{body}</g>"


class Defs:
    """Collects <defs> with ids namespaced per file."""

    def __init__(self, ns):
        self.ns, self.items, self.n = ns, [], 0

    def clip(self, ds):
        self.n += 1
        cid = f"{self.ns}-c{self.n}"
        if isinstance(ds, str):
            ds = [ds]
        self.items.append(f'<clipPath id="{cid}">' + "".join(f'<path d="{d}"/>' for d in ds) + "</clipPath>")
        return cid

    def render(self):
        return "<defs>" + "".join(self.items) + "</defs>" if self.items else ""


# ---- body parts -----------------------------------------------------------
TORSO = ("M80 114 C64 110 48 115 38 123 C22 130 15 142 16 158 L36 230 L164 230 L184 158 "
         "C185 142 178 130 162 123 C152 115 136 110 120 114Z")
NECK = "M78 96 L76 126 L124 126 L122 96Z"
HEAD = ("M69 46 C69 24 131 24 131 46 L133 84 C134 101 131 109 125 114 "
        "Q115 121 100 121 Q85 121 75 114 C69 109 66 101 67 84Z")


def torso(D, flex=False):
    out = [blob([TORSO], BLUE, W)]
    cid = D.clip(TORSO)
    det = [
        # chest highlight (pecs catching light)
        f'<ellipse cx="70" cy="140" rx="22" ry="9" fill="{BLUE_HI}" transform="rotate(-8 70 140)"/>',
        f'<ellipse cx="130" cy="140" rx="22" ry="9" fill="{BLUE_HI}" transform="rotate(8 130 140)"/>',
        # pecs straining the shirt
        path("M36 146 Q62 168 98 158 L98 166 Q60 176 34 156Z", BLUE_LIP, None, extra=' opacity=".55"'),
        path("M164 146 Q138 168 102 158 L102 166 Q140 176 166 156Z", BLUE_LIP, None, extra=' opacity=".55"'),
        line("M38 146 Q62 166 97 158", 3.5, BLUE_LIP),
        line("M162 146 Q138 166 103 158", 3.5, BLUE_LIP),
        # abs hint below
        line("M70 186 Q84 192 96 188", 3, BLUE_LIP),
        line("M130 186 Q116 192 104 188", 3, BLUE_LIP),
        # placket + strained buttons
        line("M100 132 V230", 3.5, BLUE_LIP),
        *[f'<circle cx="100" cy="{y}" r="2.6" fill="{WHITE}" stroke="{BLUE_LIP}" stroke-width="1.5"/>' for y in (146, 170, 194)],
        line("M93 152 Q100 157 107 152", 2.2, BLUE_LIP),
        line("M93 176 Q100 181 107 176", 2.2, BLUE_LIP),
        # pocket flap on the right chest + generic star badge on the left chest
        path("M48 160 L74 158 L74 166 Q61 171 48 167Z", BLUE_LIP, None),
        path(star(132, 142, 10.5, 4.8), GOLD, INK, 2.8),
        f'<circle cx="132" cy="142.5" r="2.4" fill="{GOLD_LIP}"/>',
    ]
    out.append(g(det, extra=f' clip-path="url(#{cid})"'))
    return "".join(out)


def neck(skin, sh, veins=False):
    out = [blob([NECK], skin)]
    out.append(line("M84 106 Q86 116 84 124", 3, sh))
    out.append(line("M116 106 Q114 116 116 124", 3, sh))
    if veins:
        out.append(line("M88 104 Q92 110 88 116 Q86 120 90 124", 2.6, RAGE_SH))
        out.append(line("M112 104 Q108 112 113 118", 2.6, RAGE_SH))
    return "".join(out)


def collar():
    # open V collar showing the bull neck
    v = path("M80 117 L100 140 L120 117 L114 116 L100 131 L86 116Z", BLUE_LIP, INK, 3)
    left = path("M100 140 L82 116 L70 120 L78 142Z", BLUE, INK, 3.5)
    right = path("M100 140 L118 116 L130 120 L122 142Z", BLUE, INK, 3.5)
    return v + left + right


def ears(skin, sh):
    out = []
    for cx in (66, 134):
        out.append(blob([circle_d(cx, 74, 9)], skin))
        out.append(line(f"M{cx + (2 if cx < 100 else -2)} 70 Q{cx + (-2 if cx < 100 else 2)} 74 {cx + (2 if cx < 100 else -2)} 79", 2.6, sh))
    return "".join(out)


def head(D, skin, sh, hi, jaw_open=0):
    hd = HEAD if not jaw_open else HEAD.replace("121", str(121 + jaw_open)).replace("114 ", f"{114 + jaw_open / 2} ")
    out = [blob([hd], skin)]
    cid = D.clip(hd)
    det = [
        # stubble / jaw shadow
        path(f"M60 92 Q72 106 100 104 Q128 106 140 92 L140 140 L60 140Z", sh, None, extra=' opacity=".45"'),
        # cheekbone highlight
        f'<ellipse cx="76" cy="82" rx="5" ry="3" fill="{hi}" opacity=".8"/>',
        # buzz-cut sideburns under the cap
        path("M66 44 L76 44 L74 64 L68 64Z", HAIR, None, extra=' opacity=".85"'),
        path("M134 44 L124 44 L126 64 L132 64Z", HAIR, None, extra=' opacity=".85"'),
    ]
    out.append(g(det, extra=f' clip-path="url(#{cid})"'))
    # square jaw corners + chin cleft
    out.append(line("M75 109 Q79 115 86 117", 2.6, sh))
    out.append(line("M125 109 Q121 115 114 117", 2.6, sh))
    out.append(line(f"M100 {116 + jaw_open} V{119.5 + jaw_open}", 2.6, sh))
    return "".join(out)


def nose(skin, sh):
    return (path("M95 72 Q93 82 89 86 Q90 92 100 92 Q110 92 111 86 Q107 82 105 72Z", skin, INK, 3)
            + line("M93 88 Q96 90 98 89", 2.2, sh) + line("M107 88 Q104 90 102 89", 2.2, sh))


def mustache(rot=0, lift=0, droop=0):
    d = (f"M100 90 C108 86 122 87 128 96 Q131 {103 + droop} 126 {108 + droop} "
         f"Q118 {99 - lift} 100 101 Q82 {99 - lift} 74 {108 + droop} Q69 {103 + droop} 72 96 C78 87 92 86 100 90Z")
    tex = (line("M84 93 L82 98", 2, "#5A3B30") + line("M92 92 L91 97", 2, "#5A3B30")
           + line("M108 92 L109 97", 2, "#5A3B30") + line("M116 93 L118 98", 2, "#5A3B30"))
    return g(path(d, HAIR, INK, 3.2) + tex, f"rotate({rot} 100 96)" if rot else None)


def glasses(D, dy=0, tilt=0, glint=True, crack=False):
    """Mirrored aviators. dy moves them down the nose."""
    out = []
    lenses = []
    for side in (-1, 1):
        cx = 100 + side * 14
        # teardrop aviator lens (outer side droops)
        x_in, x_out = 100 + side * 4, 100 + side * 30
        d = (f"M{x_in} {63 + dy} Q{cx} {59 + dy} {x_out} {61 + dy} "
             f"Q{x_out + side * 1} {73 + dy} {cx + side * 8} {80 + dy} "
             f"Q{cx} {84 + dy} {cx - side * 6} {80 + dy} "
             f"Q{x_in - side * 1} {74 + dy} {x_in} {63 + dy}Z")
        lenses.append(d)
    # temples to the ears
    out.append(line(f"M71 {63 + dy} L64 {70 + dy * .3}", 3.2))
    out.append(line(f"M129 {63 + dy} L136 {70 + dy * .3}", 3.2))
    for d in lenses:
        cid = D.clip(d)
        out.append(f'<path d="{d}" fill="{LENS_BOT}"/>')
        out.append(g([
            f'<path d="M60 {50 + dy} H140 V{70 + dy} Q100 {64 + dy} 60 {74 + dy}Z" fill="{LENS_TOP}"/>',
            f'<path d="M60 {86 + dy} L90 {50 + dy} L97 {50 + dy} L67 {86 + dy}Z" fill="{WHITE}" opacity=".55"/>',
            f'<path d="M104 {86 + dy} L134 {50 + dy} L137 {50 + dy} L107 {86 + dy}Z" fill="{WHITE}" opacity=".45"/>',
        ], extra=f' clip-path="url(#{cid})"'))
        out.append(path(d, "none", INK, 3.6))
    # double bridge
    out.append(line(f"M96 {63 + dy} Q100 {60 + dy} 104 {63 + dy}", 3))
    out.append(line(f"M92 {60 + dy} Q100 {57 + dy} 108 {60 + dy}", 2.4))
    if crack:
        out.append(line(f"M120 {62 + dy} L116 {69 + dy} L121 {72 + dy} L117 {79 + dy}", 1.8, WHITE))
    if glint:
        out.append(f'<path d="{sparkle(125, 65 + dy, 5)}" fill="{WHITE}"/>')
    body = "".join(out)
    return g(body, f"rotate({tilt} 100 {70 + dy})") if tilt else body


def brows(lin, lout, rin, rout, thick=7):
    """Heavy slab brows. y of inner/outer ends per side (lower = angrier)."""
    def slab(x_in, y_in, x_out, y_out):
        return path(f"M{x_in} {y_in} L{x_out} {y_out} L{x_out} {y_out - thick + 2} "
                    f"Q{(x_in + x_out) / 2} {(y_in + y_out) / 2 - thick - 1} {x_in} {y_in - thick}Z", HAIR, INK, 2.6)
    return slab(96, lin, 70, lout) + slab(104, rin, 130, rout)


def cap(tilt=0, dy=-6):
    parts = [
        # crown (wide, stiff patrol cap)
        path("M58 38 Q54 22 70 15 Q100 4 130 15 Q146 22 142 38 Q100 46 58 38Z", BLUE, INK, W),
        f'<ellipse cx="80" cy="19" rx="12" ry="3.6" fill="{WHITE}" opacity=".28" transform="rotate(-12 80 19)"/>',
        # band
        path("M64 36 Q100 43 136 36 L134 50 Q100 56 66 50Z", BLUE_LIP, INK, W),
        line("M66 43.5 Q100 50 134 43.5", 2.2, GOLD),
        # visor, pulled low
        path("M62 50 Q100 59 138 50 Q144 54 138 59 Q100 70 62 59 Q56 54 62 50Z", INK, INK, 2),
        line("M70 58 Q100 65 130 58", 1.8, "#3A4270"),
        # generic star cap badge
        path(star(100, 29, 9, 4), GOLD, INK, 2.6),
    ]
    tr = []
    if dy:
        tr.append(f"translate(0 {dy})")
    if tilt:
        tr.append(f"rotate({tilt} 100 50)")
    return g(parts, " ".join(tr) if tr else None)


def sleeve(D, arm_pts, poly, hem, lip_off, grow=3):
    """Tight blue short sleeve hugging the top of an arm.

    arm_pts: the (x, y, r) joints of the upper arm; the sleeve is that limb grown by
    `grow`, cut along the hem line (poly = the shoulder side of the hem)."""
    big = chain(*[(x, y, r + grow) for x, y, r in arm_pts])
    pc = D.clip(poly)
    hc = D.clip(big)
    hx1, hy1, hx2, hy2 = hem
    lx, ly = lip_off
    return (g(blob(big, BLUE), extra=f' clip-path="url(#{pc})"')
            + g([line(f"M{hx1 + lx} {hy1 + ly} L{hx2 + lx} {hy2 + ly}", 3.5, BLUE_LIP),
                 line(f"M{hx1} {hy1} L{hx2} {hy2}", W)], extra=f' clip-path="url(#{hc})"'))


def fist(cx, cy, skin, sh, rot=0, w=27, h=22):
    x, y = cx - w / 2, cy - h / 2
    parts = [
        blob([rrect_d(x, y, w, h, 8)], skin),
        line(f"M{x + w * .27} {y + 1} V{y + 8}", 2.4, sh),
        line(f"M{x + w * .5} {y + 1} V{y + 9}", 2.4, sh),
        line(f"M{x + w * .73} {y + 1} V{y + 8}", 2.4, sh),
        # thumb wrapped across the front
        path(capsule(x + 4, y + h * .66, 5.2, x + w * .58, y + h * .66, 5), skin, INK, 2.8),
    ]
    return g(parts, f"rotate({rot} {cx} {cy})" if rot else None)


def thumbs_up(cx, cy, skin, sh, rot=0):
    """Fist seen from the side, fingers curled toward viewer, thumb up."""
    w, h = 26, 28
    x, y = cx - w / 2, cy - h / 2
    parts = [
        blob([capsule(x + 7, y + 4, 6.5, x + 5, y - 15, 6)], skin),  # thumb
        line(f"M{x + 3} {y - 9} Q{x + 7} {y - 11} {x + 11} {y - 9}", 2.2, sh),  # thumbnail-ish crease
        blob([rrect_d(x, y, w, h, 9)], skin),
        line(f"M{x + 6} {y + h * .34} H{x + w - 4}", 2.4, sh),
        line(f"M{x + 6} {y + h * .6} H{x + w - 4}", 2.4, sh),
        line(f"M{x + 6} {y + h * .84} H{x + w - 6}", 2.4, sh),
    ]
    return g(parts, f"rotate({rot} {cx} {cy})" if rot else None)


def point_up(cx, cy, skin, sh, rot=0):
    """Wagging index finger (No-no-no)."""
    w, h = 25, 22
    x, y = cx - w / 2, cy - h / 2
    parts = [
        blob([capsule(x + w * .36, y + 6, 5.4, x + w * .36, y - 25, 4.6)], skin),
        path(f"M{x + w * .36 - 2.6} {y - 24} Q{x + w * .36} {y - 29} {x + w * .36 + 2.6} {y - 24} L{x + w * .36 + 2.4} {y - 19} H{x + w * .36 - 2.4}Z", "#FFD0BC", INK, 1.6),
        line(f"M{x + w * .22} {y - 8} Q{x + w * .36} {y - 6} {x + w * .5} {y - 8}", 2, sh),
        blob([rrect_d(x, y, w, h, 8)], skin),
        line(f"M{x + w * .66} {y + 1} V{y + 8}", 2.4, sh),
        line(f"M{x + w * .84} {y + 2} V{y + 8}", 2.4, sh),
        path(capsule(x + 4, y + h * .64, 5, x + w * .55, y + h * .64, 4.8), skin, INK, 2.8),
    ]
    return g(parts, f"rotate({rot} {cx} {cy})" if rot else None)
# ---- arms -----------------------------------------------------------------
def mirror(side):
    """x mapper: side -1 = viewer's left (as drawn), +1 = viewer's right."""
    return (lambda x: x) if side < 0 else (lambda x: 200 - x)


SLEEVE_POLY = "M-20 80 L64 80 L64 146 L-20 158Z"
SLEEVE_HEM = (-20, 158, 64, 146)


def arm_sleeve(D, side, pts):
    X = mirror(side)
    poly = SLEEVE_POLY if side < 0 else "M220 80 L136 80 L136 146 L220 158Z"
    hem = SLEEVE_HEM if side < 0 else (220, 158, 136, 146)
    return sleeve(D, pts, poly, hem, (0, -4))


def arm_down(D, side, skin, sh, hi):
    """Hanging arm: huge bicep, cropped by the frame bottom."""
    X = mirror(side)
    upper = [(X(33), 136, 20), (X(18), 164, 24), (X(26), 204, 18), (X(30), 240, 17)]
    out = [blob(chain(*upper), skin)]
    out.append(f'<ellipse cx="{X(14)}" cy="172" rx="4" ry="9" fill="{hi}"/>')
    out.append(line(f"M{X(32)} 170 Q{X(38)} 186 {X(32)} 200", 2.8, sh))
    out.append(line(f"M{X(12)} 194 Q{X(20)} 202 {X(30)} 200", 2.8, sh))
    out.append(arm_sleeve(D, side, upper[:2]))
    return "".join(out)


def arm_flexed_up(D, side, skin, sh, hi, hand_xy, elbow_xy=None):
    """Upper arm down-out, forearm folded up to hand_xy: bicep peak on show."""
    s = side
    X = mirror(side)
    ex, ey = elbow_xy if elbow_xy else (X(22), 196)
    hx, hy = hand_xy
    upper = [(X(33), 136, 20), (X(17), 162, 24), (ex, ey, 18)]
    mx, my = (ex + hx) / 2, (ey + hy) / 2
    fore = chain((ex, ey, 17), (mx - s * 2, my + 4, 16), (hx, hy + 6, 11.5))
    out = [blob(chain(*upper), skin)]
    out.append(line(f"M{X(12)} 152 Q{X(7)} 166 {X(14)} 180", 2.8, sh))  # tricep
    out.append(arm_sleeve(D, side, upper[:2]))
    out.append(blob(fore, skin))
    out.append(line(f"M{mx + s * 7} {my + 14} Q{mx + s * 11} {my} {hx + s * 7} {hy + 12}", 2.6, sh))
    # bicep peak bulging toward the viewer
    peak = [(X(31), 154, 16), (X(26) + s * 0, 172, 17), (ex - s * 4, ey - 12, 13)]
    out.append(blob(chain(*peak), skin))
    out.append(f'<ellipse cx="{X(24)}" cy="166" rx="4.5" ry="8" fill="{hi}" transform="rotate({-s * 20} {X(24)} 166)"/>')
    out.append(line(f"M{X(34)} 166 Q{X(42)} 176 {ex - s * 8} {ey - 4}", 2.6, sh))
    out.append(arm_sleeve(D, side, peak[:2]))
    return "".join(out)


def arms_crossed(D, skin, sh, hi):
    lu = [(33, 136, 20), (16, 162, 24), (28, 196, 18)]
    ru = [(167, 136, 20), (184, 162, 24), (172, 196, 18)]
    back = chain((172, 194, 17), (112, 174, 16), (54, 166, 13))    # right forearm, behind
    front = chain((28, 196, 18), (90, 192, 17), (150, 178, 13))    # left forearm, in front
    out = [blob(back, skin)]
    out.append(line("M150 184 Q128 176 110 180", 2.6, sh))
    out.append(blob(front, skin))
    out.append(f'<ellipse cx="70" cy="188" rx="12" ry="3.4" fill="{hi}" transform="rotate(-6 70 188)"/>')
    out.append(line("M54 202 Q80 198 104 200", 2.6, sh))
    for pts, X in ((ru, lambda x: 200 - x), (lu, lambda x: x)):
        out.append(blob(chain(*pts), skin))
        out.append(f'<ellipse cx="{X(13)}" cy="170" rx="4" ry="9" fill="{hi}"/>')
        out.append(line(f"M{X(30)} 168 Q{X(38)} 180 {X(32)} 190", 2.8, sh))
        out.append(arm_sleeve(D, -1 if X(0) == 0 else 1, pts[:2]))
    return "".join(out)


# ---- face bits --------------------------------------------------------------
def frown_mouth():
    return line("M91 112 Q100 106 109 112", 3.8)


HEAD_K = 1.1           # head scale around the neck (readability at small sizes)
HEAD_O = (100, 114)
FIG_K = 0.88           # whole figure scale around bottom centre (room for props)


def H(x, y):
    """Head space -> body space."""
    return HEAD_O[0] + (x - HEAD_O[0]) * HEAD_K, HEAD_O[1] + (y - HEAD_O[1]) * HEAD_K


def HG(items):
    ox, oy = HEAD_O
    return g(items, f"translate({ox} {oy}) scale({HEAD_K}) translate({-ox} {-oy})")


def figure(D, face, front=(), behind=(), skin=SKIN, sh=SKIN_SH, hi=SKIN_HI, veins=False, jaw_open=0):
    body = [neck(skin, sh, veins), torso(D), collar()]
    headg = HG(list(behind) + [ears(skin, sh), head(D, skin, sh, hi, jaw_open)] + list(face))
    items = body + [headg] + list(front)
    return g(items, f"translate(100 200) scale({FIG_K}) translate(-100 -200)")


def wrap(name, label, D, inner):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" '
            f'role="img" aria-labelledby="{name}-t">\n'
            f'  <title id="{name}-t">{label}</title>\n  {D.render()}\n  {inner}\n</svg>\n')


# ---- poses ----------------------------------------------------------------
def grumpy_face(D):
    return [nose(SKIN, SKIN_SH), glasses(D), brows(73, 63, 73, 63, 8),
            mustache(droop=3), frown_mouth(), cap()]


def grumpy():
    n = "kp-grumpy"
    D = Defs(n)
    fig = figure(D, grumpy_face(D), [arms_crossed(D, SKIN, SKIN_SH, SKIN_HI)])
    return wrap(n, "Strážmajster Paťo – ruky prekrížené, súdi ťa", D, fig)


def watching():
    n = "kp-watching"
    D = Defs(n)
    lc, lr = (118, 69), 19
    lens_clip = D.clip(circle_d(*lc, lr))
    face = [
        nose(SKIN, SKIN_SH),
        # squinting left eye: tight slit under a heavy lid
        path("M74 73 Q84 68.5 95 72 Q85 76 74 73Z", WHITE, INK, 2.8),
        f'<circle cx="88" cy="72.3" r="2.2" fill="{INK}"/>',
        line("M72 70.5 Q84 65.5 97 70", 4),
        line("M76 77 Q85 79 93 76", 2.4, SKIN_SH),
        glasses(D, dy=18, tilt=-5, glint=False),
        brows(67, 64, 57, 55, 7),
        mustache(rot=-3, droop=2),
        line("M92 112 Q99 109 108 111", 3.6),
        cap(dy=-12, tilt=-3),
    ]
    lens = HG([
        g([f'<rect x="90" y="40" width="60" height="60" fill="{SKIN}"/>',
           path("M96 56 L140 49 L140 40 L96 40Z", HAIR, INK, 2.6),
           f'<ellipse cx="118" cy="70" rx="12.5" ry="11.5" fill="{WHITE}" stroke="{INK}" stroke-width="3"/>',
           f'<circle cx="115" cy="71" r="6" fill="{INK}"/>',
           f'<circle cx="117.5" cy="68.5" r="2" fill="{WHITE}"/>',
           f'<path d="M104 76 Q106 60 120 54" fill="none" stroke="{WHITE}" stroke-width="3.5" stroke-linecap="round" opacity=".85"/>'],
          extra=f' clip-path="url(#{lens_clip})"'),
        f'<circle cx="{lc[0]}" cy="{lc[1]}" r="{lr}" fill="{LENS_TOP}" opacity=".15"/>',
        f'<circle cx="{lc[0]}" cy="{lc[1]}" r="{lr}" fill="none" stroke="{INK}" stroke-width="6.5"/>',
        f'<circle cx="{lc[0]}" cy="{lc[1]}" r="{lr - 4.2}" fill="none" stroke="{WHITE}" stroke-width="1.6" opacity=".6"/>',
    ])
    hx, hy = H(132, 84)
    front = [
        arm_down(D, -1, SKIN, SKIN_SH, SKIN_HI),
        blob([capsule(hx, hy, 4.2, 152, 112, 5.2)], INK, 1),
        arm_flexed_up(D, 1, SKIN, SKIN_SH, SKIN_HI, (155, 116), (184, 196)),
        fist(155, 118, SKIN, SKIN_SH, rot=-35),
        lens,
    ]
    return wrap(n, "Strážmajster Paťo – skúma tvoju fotku cez lupu", D, figure(D, face, front))


def steam(cx, cy, s, flip=1):
    d1 = circle_d(cx, cy, 6 * s)
    d2 = circle_d(cx + flip * 7 * s, cy - 6 * s, 7.5 * s)
    d3 = circle_d(cx + flip * 2 * s, cy - 13 * s, 6 * s)
    d4 = circle_d(cx + flip * 14 * s, cy - 15 * s, 5 * s)
    return blob([d1, d2, d3, d4], STEAM, 3)


def anger_mark(cx, cy, s=1, color=SIREN):
    q = []
    for ang in (45, 135, 225, 315):
        a = math.radians(ang)
        a1, a2 = a - math.radians(36), a + math.radians(36)
        ox, oy = cx + math.cos(a) * 3 * s, cy + math.sin(a) * 3 * s
        q.append(f"M{f(cx + math.cos(a1) * 11 * s)} {f(cy + math.sin(a1) * 11 * s)} "
                 f"Q{f(ox)} {f(oy)} {f(cx + math.cos(a2) * 11 * s)} {f(cy + math.sin(a2) * 11 * s)}")
    return g([line(d, 8 * s, INK) for d in q]) + g([line(d, 3.6 * s, color) for d in q])


def angry():
    n = "kp-angry"
    D = Defs(n)
    J = 6
    face = [
        path(f"M84 100 Q100 96 116 100 Q119 {116 + J} 100 {121 + J} Q81 {116 + J} 84 100Z", MOUTH, INK, 3.4),
        path("M86 101 Q100 97 114 101 L113 106 Q100 103 87 106Z", WHITE, None),
        path(f"M90 {115 + J} Q100 {106 + J} 110 {115 + J} Q100 {121 + J} 90 {115 + J}Z", TONGUE, None),
        nose(RAGE, RAGE_SH),
        glasses(D, glint=False, crack=True),
        brows(75, 60, 75, 60, 9),
        mustache(lift=4, droop=-2),
        cap(dy=-9),
        anger_mark(136, 26, 1),
    ]
    behind = [steam(56, 70, 1.1, -1), steam(144, 70, 1.1, 1)]
    front = [
        arm_flexed_up(D, -1, RAGE, RAGE_SH, RAGE_HI, (38, 110), (16, 194)),
        point_up(38, 114, RAGE, RAGE_SH, rot=-12),
        blob([rrect_d(171, 6, 12, 100, 5.5)], INK, 1.5),
        line("M175 12 V64", 2.4, "#4A5072"),
        blob([rrect_d(166, 78, 21, 8, 3)], INK, 1.5),
        arm_flexed_up(D, 1, RAGE, RAGE_SH, RAGE_HI, (177, 100), (188, 192)),
        fist(177, 102, RAGE, RAGE_SH, rot=8),
        line("M192 14 Q199 24 194 36", 3.2), line("M160 10 Q153 20 157 32", 3.2),
        line("M18 70 Q11 80 15 90", 3.2), line("M54 72 Q61 82 57 92", 3.2),
    ]
    fig = figure(D, face, front, behind, RAGE, RAGE_SH, RAGE_HI, veins=True, jaw_open=J)
    return wrap(n, "Strážmajster Paťo – zúrivo kričí", D, fig)


def approve():
    n = "kp-approve"
    D = Defs(n)
    face = [
        nose(SKIN, SKIN_SH),
        glasses(D),
        brows(70, 65, 67, 59, 8),
        mustache(rot=-6, lift=1),
        line("M93 113 Q103 114 111 107", 3.8),
        line("M110 104.5 L113.5 109", 2.6),
        cap(tilt=-3),
    ]
    front = [
        arm_down(D, -1, SKIN, SKIN_SH, SKIN_HI),
        arm_flexed_up(D, 1, SKIN, SKIN_SH, SKIN_HI, (164, 108), (186, 194)),
        thumbs_up(164, 106, SKIN, SKIN_SH, rot=6),
        f'<path d="{sparkle(184, 66, 7.5)}" fill="{GOLD}" stroke="{INK}" stroke-width="2.4" stroke-linejoin="round"/>',
    ]
    return wrap(n, "Strážmajster Paťo – neochotne schvaľuje", D, figure(D, face, front))


def cuff_ring(cx, cy, r):
    return (f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{INK}" stroke-width="10.5"/>'
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{STEEL}" stroke-width="4.5"/>'
            f'<path d="M{f(cx - r * .7)} {f(cy - r * .7)} A{r} {r} 0 0 1 {f(cx + r * .2)} {f(cy - r)}" '
            f'fill="none" stroke="{WHITE}" stroke-width="2" stroke-linecap="round"/>')


def handcuffs(x, y):
    """Dangling from (x, y): ring hooked on the finger, chain, second ring swinging."""
    r1 = (x - 2, y + 9, 9)
    r2 = (x - 8, y + 47, 11)
    links = [(x - 3, y + 20), (x - 5, y + 28), (x - 7, y + 35)]
    out = [cuff_ring(*r1)]
    for lx, ly in links:
        out.append(f'<ellipse cx="{lx}" cy="{ly}" rx="3" ry="4.6" fill="none" stroke="{INK}" stroke-width="5.6"/>')
        out.append(f'<ellipse cx="{lx}" cy="{ly}" rx="3" ry="4.6" fill="none" stroke="{STEEL}" stroke-width="2"/>')
    out.append(cuff_ring(*r2))
    # ratchet tooth on the swinging ring
    out.append(path(f"M{r2[0] - 12} {r2[1] - 3} L{r2[0] - 19} {r2[1] - 1} L{r2[0] - 17} {r2[1] + 5} L{r2[0] - 11} {r2[1] + 3}Z", STEEL, INK, 2.6))
    return "".join(out)


def arrest():
    n = "kp-arrest"
    D = Defs(n)
    face = [
        nose(SKIN, SKIN_SH),
        path("M85 104 Q100 121 119 100 Q102 109 85 104Z", WHITE, INK, 3.2),
        line("M93 108 L93.5 112", 1.8), line("M100 109.5 L100 114", 1.8), line("M107 108 L107 112.5", 1.8),
        line("M118 98.5 L122 101", 2.8),
        glasses(D),
        brows(70, 66, 67, 57, 8),
        mustache(rot=-7, lift=3),
        cap(tilt=4),
    ]
    front = [
        arm_down(D, -1, SKIN, SKIN_SH, SKIN_HI),
        arm_flexed_up(D, 1, SKIN, SKIN_SH, SKIN_HI, (168, 96), (188, 192)),
        fist(168, 98, SKIN, SKIN_SH, rot=-6),
        handcuffs(158, 104),
        f'<path d="{sparkle(186, 140, 6)}" fill="{WHITE}" stroke="{INK}" stroke-width="2.2" stroke-linejoin="round"/>',
        f'<path d="{sparkle(126, 170, 4.5)}" fill="{WHITE}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>',
    ]
    return wrap(n, "Strážmajster Paťo – zatýka ťa", D, figure(D, face, front))


def icon():
    n = "kp-icon"
    D = Defs(n)
    body = [neck(SKIN, SKIN_SH), torso(D), collar(),
            HG([ears(SKIN, SKIN_SH), head(D, SKIN, SKIN_SH, SKIN_HI)] + grumpy_face(D))]
    bg = "M0 112 Q0 0 112 0 H400 Q512 0 512 112 V370 Q512 482 400 482 H112 Q0 482 0 370Z"  # lip peeks below
    cid = D.clip(bg)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-labelledby="{n}-t">
  <title id="{n}-t">Kalorická polícia</title>
  {D.render()}
  <rect width="512" height="512" rx="112" fill="{SIREN_LIP}"/>
  <path d="{bg}" fill="{SIREN}"/>
  <g clip-path="url(#{cid})">
    <circle cx="256" cy="236" r="190" fill="#FF6679"/>
    <g transform="translate(256 266) scale(2.75) translate(-100 -76)">{"".join(body)}</g>
  </g>
</svg>
'''


if __name__ == "__main__":
    os.makedirs(os.path.join(OUT, "mascot"), exist_ok=True)
    for name, fn in [("grumpy", grumpy), ("watching", watching), ("angry", angry),
                     ("approve", approve), ("arrest", arrest)]:
        with open(os.path.join(OUT, "mascot", f"{name}.svg"), "w") as fh:
            fh.write(fn())
    with open(os.path.join(OUT, "icon.svg"), "w") as fh:
        fh.write(icon())
    print("ok")
