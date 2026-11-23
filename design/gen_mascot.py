"""Generate Paťo mascot SVGs (5 expressions) + app icon for Kalorická polícia."""
import math, os, sys

OUT = sys.argv[1]

INK = "#1E2446"
TOMATO = "#FF5B45"
SHADE = "#E3412D"
DEEP = "#C73422"
CHEEK = "#FF9E8C"
LEAF = "#43C45B"
LEAF_D = "#2F9944"
BLUE = "#3B5BF6"
BLUE_LIP = "#2A40C2"
GOLD = "#FFC21A"
GOLD_LIP = "#D99A00"
MOUTH = "#6B1A22"
TONGUE = "#FF8A9A"


def star(cx, cy, ro, ri, rot=-90):
    pts = []
    for i in range(10):
        r = ro if i % 2 == 0 else ri
        a = math.radians(rot + i * 36)
        pts.append(f"{cx + r * math.cos(a):.2f} {cy + r * math.sin(a):.2f}")
    return "M" + " L".join(pts) + "Z"


def sparkle(cx, cy, s):
    return (f"M{cx} {cy - s} Q{cx + s * .2} {cy - s * .2} {cx + s} {cy} "
            f"Q{cx + s * .2} {cy + s * .2} {cx} {cy + s} "
            f"Q{cx - s * .2} {cy + s * .2} {cx - s} {cy} "
            f"Q{cx - s * .2} {cy - s * .2} {cx} {cy - s}Z")


def body(pid):
    return f'''  <g clip-path="url(#{pid}-body)">
    <rect x="30" y="50" width="140" height="140" fill="{SHADE}"/>
    <circle cx="94" cy="111" r="60" fill="{TOMATO}"/>
  </g>
  <ellipse cx="62" cy="98" rx="11" ry="6" fill="#FFFFFF" opacity=".35" transform="rotate(-40 62 98)"/>'''


def leaf():
    return (f'  <path d="M138 62 C146 48 162 44 170 52 C164 62 150 68 138 62Z" fill="{LEAF}"/>\n'
            f'  <path d="M142 61 C150 56 158 53 165 53" fill="none" stroke="{LEAF_D}" stroke-width="2.5" stroke-linecap="round"/>')


def cap(transform=""):
    t = f' transform="{transform}"' if transform else ""
    return f'''  <g{t}>
    <path d="M44 34 Q100 0 156 34 Q158 46 144 48 L56 48 Q42 46 44 34Z" fill="{BLUE}"/>
    <ellipse cx="74" cy="25" rx="13" ry="4.5" fill="#FFFFFF" opacity=".3" transform="rotate(-16 74 25)"/>
    <rect x="58" y="44" width="84" height="12" fill="{BLUE}"/>
    <rect x="55" y="52" width="90" height="14" rx="6" fill="{BLUE_LIP}"/>
    <path d="M54 64 Q100 82 146 64 Q150 70 142 74 Q100 90 58 74 Q50 70 54 64Z" fill="{INK}"/>
    <circle cx="100" cy="36" r="11" fill="{GOLD}" stroke="{GOLD_LIP}" stroke-width="3"/>
    <path d="{star(100, 36.5, 6.2, 2.7)}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.2" stroke-linejoin="round"/>
  </g>'''


def badge():
    return f'  <path d="{star(128, 154, 10, 4.6)}" fill="{GOLD}" stroke="{GOLD_LIP}" stroke-width="2.5" stroke-linejoin="round"/>'


def cheeks():
    return (f'  <ellipse cx="63" cy="124" rx="10" ry="6" fill="{CHEEK}"/>\n'
            f'  <ellipse cx="137" cy="124" rx="10" ry="6" fill="{CHEEK}"/>')


def arm(cx, cy, rot, rx=10, ry=16):
    return f'  <ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{SHADE}" transform="rotate({rot} {cx} {cy})"/>'


def feet():
    return (f'  <ellipse cx="78" cy="178" rx="15" ry="9" fill="{DEEP}"/>\n'
            f'  <ellipse cx="122" cy="178" rx="15" ry="9" fill="{DEEP}"/>')


def shadow(rx=50):
    return f'  <ellipse cx="100" cy="189" rx="{rx}" ry="7" fill="{INK}" opacity=".12"/>'


def eyes_open(dx=0, dy=0, ry=10):
    out = []
    for x in (80, 120):
        out.append(f'  <ellipse cx="{x + dx}" cy="{108 + dy}" rx="8" ry="{ry}" fill="{INK}"/>')
        out.append(f'  <circle cx="{x + dx + 3}" cy="{104 + dy}" r="3" fill="#FFFFFF"/>')
    return "\n".join(out)


def stroke(d, w=4.5, color=INK):
    return f'  <path d="{d}" fill="none" stroke="{color}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'


def wrap(name, label, inner):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" role="img" aria-labelledby="{name}-title">
  <title id="{name}-title">{label}</title>
  <defs>
    <clipPath id="{name}-body"><circle cx="100" cy="118" r="62"/></clipPath>
  </defs>
{inner}
</svg>
'''


def happy():
    n = "kp-happy"
    parts = [
        shadow(), feet(), body(n), leaf(),
        arm(42, 134, 20), arm(162, 100, 38),
        badge(), cheeks(), eyes_open(),
        stroke("M72 92 Q80 87 88 92", 4), stroke("M112 92 Q120 87 128 92", 4),
        f'  <path d="M86 126 Q100 146 114 126 Q100 130 86 126Z" fill="{MOUTH}" stroke="{MOUTH}" stroke-width="2" stroke-linejoin="round"/>',
        f'  <path d="M93 134.5 Q100 131 107 134.5 Q100 141 93 134.5Z" fill="{TONGUE}"/>',
        cap(),
    ]
    return wrap(n, "Paťo – šťastný", "\n".join(parts))


def thinking():
    n = "kp-thinking"
    parts = [
        shadow(), feet(), body(n), leaf(),
        arm(42, 134, 20),
        badge(), cheeks(),
        # eyes looking up-right
        f'  <ellipse cx="83" cy="106" rx="8" ry="10" fill="{INK}"/>',
        f'  <circle cx="86" cy="101" r="3" fill="#FFFFFF"/>',
        f'  <ellipse cx="123" cy="106" rx="8" ry="10" fill="{INK}"/>',
        f'  <circle cx="126" cy="101" r="3" fill="#FFFFFF"/>',
        stroke("M71 89 Q80 82 89 88", 4),          # raised brow
        stroke("M113 92 L129 90", 4),              # flat brow
        stroke("M91 133 Q97 129 103 132 Q107 134 111 131", 4),  # "hmm" mouth
        # thought dots
        f'  <circle cx="36" cy="80" r="4" fill="#C9CEE0"/>',
        f'  <circle cx="26" cy="64" r="5.5" fill="#C9CEE0"/>',
        f'  <circle cx="20" cy="45" r="7.5" fill="#C9CEE0"/>',
        # magnifying glass
        stroke("M155 113 L146 127", 8),
        f'  <circle cx="165" cy="100" r="17" fill="#DFF1FF" fill-opacity=".9" stroke="{INK}" stroke-width="6"/>',
        stroke("M156 94 Q159 88 166 87", 3.5, "#FFFFFF"),
        f'  <circle cx="146" cy="130" r="9.5" fill="{SHADE}"/>',
        cap(),
    ]
    return wrap(n, "Paťo – premýšľa a analyzuje jedlo", "\n".join(parts))


def celebrate():
    n = "kp-celebrate"
    confetti = [
        f'  <rect x="18" y="26" width="10" height="6" rx="2" fill="{BLUE}" transform="rotate(-25 23 29)"/>',
        f'  <rect x="168" y="18" width="10" height="6" rx="2" fill="#F0436B" transform="rotate(30 173 21)"/>',
        f'  <rect x="10" y="122" width="10" height="6" rx="2" fill="#1FC77E" transform="rotate(40 15 125)"/>',
        f'  <rect x="182" y="132" width="10" height="6" rx="2" fill="#B85CF5" transform="rotate(-35 187 135)"/>',
        f'  <rect x="160" y="160" width="9" height="5" rx="2" fill="{GOLD}" transform="rotate(20 164 162)"/>',
        f'  <circle cx="30" cy="158" r="4" fill="#2FA4F0"/>',
        f'  <circle cx="186" cy="64" r="4" fill="{GOLD}"/>',
        f'  <circle cx="14" cy="70" r="3.5" fill="#F0436B"/>',
        f'  <path d="{sparkle(176, 92, 7)}" fill="{GOLD}"/>',
        f'  <path d="{sparkle(24, 100, 6)}" fill="{GOLD}"/>',
        f'  <path d="{sparkle(150, 12, 5)}" fill="#2FA4F0"/>',
    ]
    parts = [
        shadow(44), *confetti,
        '  <g transform="translate(0 -4)">',
        feet(), body(n), leaf(),
        arm(38, 84, -32), arm(162, 84, 32),
        f'  <circle cx="30" cy="70" r="9" fill="{SHADE}"/>',
        f'  <circle cx="170" cy="70" r="9" fill="{SHADE}"/>',
        badge(), cheeks(),
        stroke("M71 111 Q80 98 89 111", 5), stroke("M111 111 Q120 98 129 111", 5),
        f'  <path d="M82 123 Q100 154 118 123 Q100 128 82 123Z" fill="{MOUTH}" stroke="{MOUTH}" stroke-width="2" stroke-linejoin="round"/>',
        f'  <path d="M90 137 Q100 130 110 137 Q100 147 90 137Z" fill="{TONGUE}"/>',
        cap(),
        '  </g>',
    ]
    return wrap(n, "Paťo – oslavuje", "\n".join(parts))


def strict():
    n = "kp-strict"
    parts = [
        shadow(), feet(), body(n), leaf(),
        arm(36, 136, 55, 10, 15),                 # hand on hip
        arm(164, 100, 28),                        # raised "stop" arm
        f'  <circle cx="172" cy="80" r="11" fill="{SHADE}"/>',
        badge(), cheeks(),
        f'  <ellipse cx="80" cy="110" rx="7.5" ry="8.5" fill="{INK}"/>',
        f'  <circle cx="83" cy="107" r="2.6" fill="#FFFFFF"/>',
        f'  <ellipse cx="120" cy="110" rx="7.5" ry="8.5" fill="{INK}"/>',
        f'  <circle cx="123" cy="107" r="2.6" fill="#FFFFFF"/>',
        stroke("M68 92 L90 99", 6), stroke("M132 92 L110 99", 6),
        # whistle
        f'  <rect x="84" y="124" width="34" height="12" rx="6" fill="{GOLD}"/>',
        f'  <rect x="82" y="125" width="9" height="10" rx="3" fill="{GOLD_LIP}"/>',
        f'  <circle cx="118" cy="132" r="10" fill="{GOLD}"/>',
        f'  <circle cx="118" cy="132" r="3.5" fill="{GOLD_LIP}"/>',
        stroke("M133 121 L141 115", 3.5), stroke("M135 131 L145 130", 3.5),
        # exclamation burst
        f'  <circle cx="28" cy="50" r="15" fill="{GOLD}" stroke="{GOLD_LIP}" stroke-width="3"/>',
        f'  <rect x="25" y="39" width="6" height="14" rx="3" fill="{INK}"/>',
        f'  <circle cx="28" cy="59" r="3.2" fill="{INK}"/>',
        cap(),
    ]
    return wrap(n, "Paťo – prísny, hravo varuje", "\n".join(parts))


def sleepy():
    n = "kp-sleepy"
    parts = [
        shadow(), feet(), body(n), leaf(),
        arm(42, 138, 18), arm(158, 138, -18),
        badge(), cheeks(),
        stroke("M71 111 Q80 118 89 111", 4.5), stroke("M111 111 Q120 118 129 111", 4.5),
        f'  <ellipse cx="100" cy="134" rx="5" ry="6" fill="{MOUTH}"/>',
        f'  <circle cx="111" cy="143" r="7" fill="#DFF1FF" stroke="#9FC7F0" stroke-width="2"/>',
        f'  <circle cx="109" cy="141" r="1.8" fill="#FFFFFF"/>',
        cap("rotate(10 100 60) translate(2 5)"),
        stroke("M158 28 H172 L158 42 H172", 4, BLUE),
        stroke("M178 8 H188 L178 18 H188", 3.5, BLUE),
    ]
    return wrap(n, "Paťo – spí, zatiaľ žiadne jedlo", "\n".join(parts))


def icon():
    face = "\n".join([
        f'    <g clip-path="url(#kp-icon-body)">',
        f'      <rect x="30" y="50" width="140" height="140" fill="{SHADE}"/>',
        f'      <circle cx="94" cy="111" r="60" fill="{TOMATO}"/>',
        f'    </g>',
        f'    <ellipse cx="62" cy="98" rx="11" ry="6" fill="#FFFFFF" opacity=".35" transform="rotate(-40 62 98)"/>',
        leaf().replace("  <", "    <"),
        cheeks().replace("  <", "    <"),
        eyes_open().replace("  <", "    <"),
        f'    <path d="M86 126 Q100 146 114 126 Q100 130 86 126Z" fill="{MOUTH}" stroke="{MOUTH}" stroke-width="2" stroke-linejoin="round"/>',
        f'    <path d="M93 134.5 Q100 131 107 134.5 Q100 141 93 134.5Z" fill="{TONGUE}"/>',
        cap().replace("\n  ", "\n    ").replace("  <g>", "    <g>"),
    ])
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" role="img" aria-labelledby="kp-icon-title">
  <title id="kp-icon-title">Kalorická polícia</title>
  <defs>
    <clipPath id="kp-icon-body"><circle cx="100" cy="118" r="62"/></clipPath>
  </defs>
  <rect width="512" height="512" rx="112" fill="{GOLD_LIP}"/>
  <rect width="512" height="490" rx="112" fill="{GOLD}"/>
  <ellipse cx="256" cy="452" rx="120" ry="14" fill="{INK}" opacity=".12"/>
  <g transform="translate(256 252) scale(2.35) translate(-100 -100)">
{face}
  </g>
</svg>
'''


os.makedirs(os.path.join(OUT, "mascot"), exist_ok=True)
for name, fn in [("happy", happy), ("thinking", thinking), ("celebrate", celebrate), ("strict", strict), ("sleepy", sleepy)]:
    with open(os.path.join(OUT, "mascot", f"{name}.svg"), "w") as f:
        f.write(fn())
with open(os.path.join(OUT, "icon.svg"), "w") as f:
    f.write(icon())
print("ok")
