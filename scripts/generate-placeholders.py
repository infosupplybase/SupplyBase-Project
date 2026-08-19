#!/usr/bin/env python3
"""
Generates the placeholder SVG imagery used across the site.

These are stand-ins only. Replace the files in public/assets/ with your own
photographs and renders (keep the same file names and nothing else has to change).

Run:  python3 scripts/generate-placeholders.py
"""
import os
import random

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'assets')

GOLD = '#d6a544'
GOLD_D = '#a87c26'


def header(w, h, sky_top, sky_bottom, seed):
    random.seed(seed)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" preserveAspectRatio="xMidYMid slice">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="{sky_top}"/><stop offset="1" stop-color="{sky_bottom}"/>
  </linearGradient>
  <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2b3038"/><stop offset="1" stop-color="#151920"/>
  </linearGradient>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#ecca7f"/><stop offset="1" stop-color="{GOLD_D}"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.72" cy="0.22" r="0.5">
    <stop offset="0" stop-color="{GOLD}" stop-opacity="0.5"/><stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="{w}" height="{h}" fill="url(#sky)"/>
<rect width="{w}" height="{h}" fill="url(#glow)"/>'''


def windows(x, y, w, h, cols, rows, lit=0.45, colour='#f2c877'):
    out = []
    pad = 10
    cw = (w - pad * (cols + 1)) / cols
    ch = (h - pad * (rows + 1)) / rows
    for c in range(cols):
        for r in range(rows):
            wx = x + pad + c * (cw + pad)
            wy = y + pad + r * (ch + pad)
            on = random.random() < lit
            fill = colour if on else '#20252d'
            op = 0.85 if on else 0.9
            out.append(f'<rect x="{wx:.1f}" y="{wy:.1f}" width="{cw:.1f}" height="{ch:.1f}" fill="{fill}" opacity="{op}" rx="1"/>')
    return '\n'.join(out)


def caption(w, h, text):
    text = text.replace("&", "&amp;")
    return (f'<text x="{w-24}" y="{h-20}" text-anchor="end" font-family="Inter, Arial, sans-serif" '
            f'font-size="17" fill="#ffffff" opacity="0.34">{text}</text>')


def exterior(w, h, seed, label):
    s = [header(w, h, '#1b2husky', '#0d1015', seed)]
    s = [header(w, h, '#232a35', '#0d1015', seed)]
    ground = h * 0.78
    # distant skyline
    x = -40
    while x < w:
        bw = random.randint(70, 150)
        bh = random.randint(80, 240)
        s.append(f'<rect x="{x}" y="{ground-bh}" width="{bw}" height="{bh}" fill="#171b22" opacity="0.75"/>')
        x += bw + random.randint(10, 40)
    # main volumes
    b1x, b1w, b1h = w * 0.30, w * 0.40, h * 0.40
    b2x, b2w, b2h = w * 0.55, w * 0.30, h * 0.28
    s.append(f'<rect x="{b1x:.0f}" y="{ground-b1h:.0f}" width="{b1w:.0f}" height="{b1h:.0f}" fill="#2a2f38"/>')
    s.append(windows(b1x, ground - b1h, b1w, b1h, 5, 3))
    s.append(f'<rect x="{b2x:.0f}" y="{ground-b1h-b2h:.0f}" width="{b2w:.0f}" height="{b2h:.0f}" fill="#343a44"/>')
    s.append(windows(b2x, ground - b1h - b2h, b2w, b2h, 4, 2, lit=0.6))
    # timber-clad wing
    s.append(f'<rect x="{w*0.12:.0f}" y="{ground-h*0.24:.0f}" width="{w*0.20:.0f}" height="{h*0.24:.0f}" fill="url(#gold)" opacity="0.55"/>')
    for i in range(9):
        yy = ground - h * 0.24 + i * (h * 0.24 / 9)
        s.append(f'<line x1="{w*0.12:.0f}" y1="{yy:.0f}" x2="{w*0.32:.0f}" y2="{yy:.0f}" stroke="#0d1015" stroke-width="1.6" opacity="0.35"/>')
    # ground + reflection
    s.append(f'<rect x="0" y="{ground:.0f}" width="{w}" height="{h-ground:.0f}" fill="#0a0c10"/>')
    s.append(f'<rect x="0" y="{ground:.0f}" width="{w}" height="6" fill="{GOLD}" opacity="0.35"/>')
    # trees
    for _ in range(6):
        tx = random.randint(20, w - 20)
        th = random.randint(60, 130)
        s.append(f'<rect x="{tx}" y="{ground-th}" width="4" height="{th}" fill="#12161c"/>')
        s.append(f'<circle cx="{tx+2}" cy="{ground-th}" r="{th*0.32:.0f}" fill="#141a20"/>')
    s.append(caption(w, h, label))
    s.append('</svg>')
    return '\n'.join(s)


def blueprint(w, h, seed, label):
    random.seed(seed)
    s = [header(w, h, '#131922', '#0a0e14', seed)]
    step = 40
    for x in range(0, w, step):
        s.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{h}" stroke="#ffffff" stroke-width="0.5" opacity="0.06"/>')
    for y in range(0, h, step):
        s.append(f'<line x1="0" y1="{y}" x2="{w}" y2="{y}" stroke="#ffffff" stroke-width="0.5" opacity="0.06"/>')
    # floor plan
    px, py, pw, ph = w * 0.16, h * 0.18, w * 0.68, h * 0.62
    s.append(f'<rect x="{px:.0f}" y="{py:.0f}" width="{pw:.0f}" height="{ph:.0f}" fill="none" stroke="{GOLD}" stroke-width="3"/>')
    s.append(f'<line x1="{px+pw*0.44:.0f}" y1="{py:.0f}" x2="{px+pw*0.44:.0f}" y2="{py+ph:.0f}" stroke="{GOLD}" stroke-width="2.2" opacity="0.9"/>')
    s.append(f'<line x1="{px:.0f}" y1="{py+ph*0.55:.0f}" x2="{px+pw*0.44:.0f}" y2="{py+ph*0.55:.0f}" stroke="{GOLD}" stroke-width="2.2" opacity="0.9"/>')
    s.append(f'<line x1="{px+pw*0.44:.0f}" y1="{py+ph*0.38:.0f}" x2="{px+pw:.0f}" y2="{py+ph*0.38:.0f}" stroke="{GOLD}" stroke-width="2.2" opacity="0.9"/>')
    s.append(f'<line x1="{px+pw*0.72:.0f}" y1="{py+ph*0.38:.0f}" x2="{px+pw*0.72:.0f}" y2="{py+ph:.0f}" stroke="{GOLD}" stroke-width="2.2" opacity="0.9"/>')
    # dimension lines
    s.append(f'<line x1="{px:.0f}" y1="{py-30:.0f}" x2="{px+pw:.0f}" y2="{py-30:.0f}" stroke="#ffffff" stroke-width="1" opacity="0.4"/>')
    s.append(f'<line x1="{px:.0f}" y1="{py-38:.0f}" x2="{px:.0f}" y2="{py-22:.0f}" stroke="#ffffff" stroke-width="1" opacity="0.4"/>')
    s.append(f'<line x1="{px+pw:.0f}" y1="{py-38:.0f}" x2="{px+pw:.0f}" y2="{py-22:.0f}" stroke="#ffffff" stroke-width="1" opacity="0.4"/>')
    # furniture blocks
    for _ in range(7):
        fx = random.uniform(px + 20, px + pw - 130)
        fy = random.uniform(py + 20, py + ph - 90)
        s.append(f'<rect x="{fx:.0f}" y="{fy:.0f}" width="{random.randint(60,110)}" height="{random.randint(40,70)}" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.28" rx="3"/>')
    s.append(caption(w, h, label))
    s.append('</svg>')
    return '\n'.join(s)


def interior(w, h, seed, label):
    random.seed(seed)
    s = [header(w, h, '#3a3128', '#15120f', seed)]
    floor = h * 0.72
    s.append(f'<rect x="0" y="{floor:.0f}" width="{w}" height="{h-floor:.0f}" fill="#241d17"/>')
    # back wall panelling
    for i in range(9):
        x = w * 0.05 + i * (w * 0.9 / 9)
        s.append(f'<rect x="{x:.0f}" y="{h*0.12:.0f}" width="{w*0.9/9-10:.0f}" height="{floor-h*0.12:.0f}" fill="#2e251d" opacity="0.85"/>')
    # cove lighting
    s.append(f'<rect x="{w*0.05:.0f}" y="{h*0.10:.0f}" width="{w*0.9:.0f}" height="10" fill="{GOLD}" opacity="0.75"/>')
    s.append(f'<rect x="{w*0.05:.0f}" y="{h*0.12:.0f}" width="{w*0.9:.0f}" height="70" fill="{GOLD}" opacity="0.12"/>')
    # sofa
    sx, sw2 = w * 0.22, w * 0.40
    s.append(f'<rect x="{sx:.0f}" y="{floor-h*0.20:.0f}" width="{sw2:.0f}" height="{h*0.13:.0f}" rx="10" fill="#4a3d31"/>')
    s.append(f'<rect x="{sx:.0f}" y="{floor-h*0.09:.0f}" width="{sw2:.0f}" height="{h*0.09:.0f}" rx="8" fill="#5b4b3c"/>')
    # rug + table
    s.append(f'<ellipse cx="{w*0.44:.0f}" cy="{floor+h*0.10:.0f}" rx="{w*0.26:.0f}" ry="{h*0.06:.0f}" fill="#2b231c"/>')
    s.append(f'<rect x="{w*0.36:.0f}" y="{floor+h*0.04:.0f}" width="{w*0.16:.0f}" height="{h*0.05:.0f}" rx="6" fill="#1d1813"/>')
    # floor lamp
    s.append(f'<rect x="{w*0.76:.0f}" y="{floor-h*0.30:.0f}" width="5" height="{h*0.30:.0f}" fill="#3c3128"/>')
    s.append(f'<path d="M{w*0.72:.0f} {floor-h*0.30:.0f} h{w*0.10:.0f} l-{w*0.02:.0f} -{h*0.08:.0f} h-{w*0.06:.0f} Z" fill="{GOLD}" opacity="0.8"/>')
    s.append(caption(w, h, label))
    s.append('</svg>')
    return '\n'.join(s)


def construction(w, h, seed, label):
    random.seed(seed)
    s = [header(w, h, '#2a3038', '#0e1116', seed)]
    ground = h * 0.82
    # frame structure
    fx, fw = w * 0.18, w * 0.5
    floors = 5
    fh = (ground - h * 0.14) / floors
    for i in range(floors + 1):
        y = ground - i * fh
        s.append(f'<rect x="{fx:.0f}" y="{y:.0f}" width="{fw:.0f}" height="10" fill="#4c525c"/>')
    for c in range(5):
        x = fx + c * (fw / 4) - 5
        s.append(f'<rect x="{x:.0f}" y="{ground-floors*fh:.0f}" width="10" height="{floors*fh:.0f}" fill="#3f444d"/>')
    # crane
    cx = w * 0.76
    s.append(f'<rect x="{cx:.0f}" y="{h*0.10:.0f}" width="10" height="{ground-h*0.10:.0f}" fill="{GOLD}" opacity="0.85"/>')
    s.append(f'<rect x="{w*0.42:.0f}" y="{h*0.10:.0f}" width="{w*0.42:.0f}" height="8" fill="{GOLD}" opacity="0.85"/>')
    s.append(f'<line x1="{w*0.52:.0f}" y1="{h*0.11:.0f}" x2="{w*0.52:.0f}" y2="{h*0.34:.0f}" stroke="#8b909a" stroke-width="2"/>')
    s.append(f'<rect x="{w*0.50:.0f}" y="{h*0.34:.0f}" width="{w*0.04:.0f}" height="{h*0.05:.0f}" fill="#6b7079"/>')
    # scaffolding lines
    for i in range(6):
        y = ground - i * fh * 0.9
        s.append(f'<line x1="{fx-30:.0f}" y1="{y:.0f}" x2="{fx+fw+30:.0f}" y2="{y:.0f}" stroke="#5a606a" stroke-width="1.5" opacity="0.5"/>')
    s.append(f'<rect x="0" y="{ground:.0f}" width="{w}" height="{h-ground:.0f}" fill="#0b0e12"/>')
    s.append(caption(w, h, label))
    s.append('</svg>')
    return '\n'.join(s)


def abstract(w, h, seed, label, motif):
    random.seed(seed)
    s = [header(w, h, '#232a35', '#0c0f14', seed)]
    for i in range(16):
        x = random.randint(0, w)
        y = random.randint(0, h)
        r = random.randint(30, 190)
        s.append(f'<rect x="{x}" y="{y}" width="{r}" height="{r}" fill="none" stroke="{GOLD}" stroke-width="1.2" opacity="{random.uniform(0.05,0.18):.2f}" transform="rotate({random.randint(0,45)} {x} {y})"/>')
    s.append(f'<g transform="translate({w/2-140:.0f} {h/2-140:.0f}) scale(11.6)" fill="none" stroke="url(#gold)" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity="0.9">{motif}</g>')
    s.append(caption(w, h, label))
    s.append('</svg>')
    return '\n'.join(s)


MOTIFS = {
    'painting': '<rect x="3" y="4" width="13" height="6" rx="1"/><path d="M16 7h3a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-7v2"/><rect x="10" y="14" width="4" height="7" rx="1"/>',
    'ceiling': '<path d="M3 5h18"/><path d="M5 5v4h14V5"/><path d="M7 9v3M12 9v5M17 9v3"/><path d="M9 20h6"/><path d="M12 14v6"/>',
    'electrical': '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/>',
    'plumbing': '<path d="M9 6h6"/><path d="M12 6v4"/><path d="M6 14a6 6 0 0 1 12 0"/><path d="M4 14h16"/><path d="M12 14v3"/><path d="M10 21h4"/><path d="M12 17v4"/>',
    'furniture': '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M12 3v18"/><path d="M10 11v2M14 11v2"/><path d="M4 8h16"/>',
    'fabrication': '<path d="m14 4 6 6-3 3-6-6z"/><path d="m11 7-7 7v6h6l7-7"/><path d="M4 20 2 22"/><path d="M18 3 20 1M21 6l2-2"/>',
    'finishing': '<path d="M3 12 12 3l9 9-9 9z"/><path d="M8 12h8M12 8v8"/>',
    'turnkey': '<path d="M3 12a5 5 0 1 0 10 0 5 5 0 0 0-10 0z"/><path d="M13 12h8"/><path d="M18 12v4M21 12v3"/>',
}

FILES = [
    ('hero-house.svg', 1600, 900, exterior, 'Placeholder — replace with your 3D render'),
    ('services/architectural-design.svg', 1600, 900, blueprint, 'Placeholder — architectural design'),
    ('services/civil-construction.svg', 1600, 900, construction, 'Placeholder — civil construction'),
    ('services/interior-design.svg', 1600, 900, interior, 'Placeholder — interior design'),
    ('projects/luxury-bungalow.svg', 1200, 900, exterior, 'Placeholder — project photo'),
    ('projects/modern-interior.svg', 1200, 900, interior, 'Placeholder — project photo'),
    ('projects/commercial-complex.svg', 1200, 900, exterior, 'Placeholder — project photo'),
    ('projects/ongoing-construction.svg', 1200, 900, construction, 'Placeholder — project photo'),
    ('projects/office-fitout.svg', 1200, 900, interior, 'Placeholder — project photo'),
    ('projects/retail-showroom.svg', 1200, 900, interior, 'Placeholder — project photo'),
    ('projects/villa-renovation.svg', 1200, 900, exterior, 'Placeholder — project photo'),
    ('projects/painting-finishing.svg', 1200, 900, interior, 'Placeholder — project photo'),
]

ABSTRACT_FILES = [
    ('services/painting.svg', 'painting', 'Placeholder — painting work'),
    ('services/pop-false-ceiling.svg', 'ceiling', 'Placeholder — POP & false ceiling'),
    ('services/electrical.svg', 'electrical', 'Placeholder — electrical work'),
    ('services/plumbing.svg', 'plumbing', 'Placeholder — plumbing work'),
    ('services/furniture.svg', 'furniture', 'Placeholder — furniture work'),
    ('services/fabrication.svg', 'fabrication', 'Placeholder — fabrication'),
    ('services/finishing.svg', 'finishing', 'Placeholder — finishing work'),
    ('services/turnkey-projects.svg', 'turnkey', 'Placeholder — turnkey projects'),
]


def write(rel, content):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as fh:
        fh.write(content)
    print('wrote', rel)


if __name__ == '__main__':
    for i, (rel, w, h, fn, label) in enumerate(FILES):
        write(rel, fn(w, h, i * 7 + 3, label))
    for i, (rel, motif, label) in enumerate(ABSTRACT_FILES):
        write(rel, abstract(1600, 900, 100 + i * 5, label, MOTIFS[motif]))
