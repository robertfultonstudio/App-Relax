"""Build small, static Latin app fonts from verified OFL source TTFs.

Usage: python3 scripts/prepare-m6-fonts.py /path/to/source-fonts
Needs fontTools, already present on the development machine. No network/install.
Source archives stay outside the repository; licenses live alongside the outputs.
"""
import hashlib
import json
import sys
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parents[1]
source = Path(sys.argv[1]).resolve()
target = root / "assets/fonts/m6"
commit = "92345ac0dbb28d27dbd32f3a782e84c55eaac214"
entries = []
specs = [
    ("ZenOldMincho-Regular.ttf", "ZenOldMincho-Latin-Regular.ttf", None, "zenoldmincho/ZenOldMincho-Regular.ttf", "ZenOldMincho-OFL.txt"),
    ("HankenGrotesk.ttf", "HankenGrotesk-Latin-Regular.ttf", 400, "hankengrotesk/HankenGrotesk[wght].ttf", "HankenGrotesk-OFL.txt"),
    ("HankenGrotesk.ttf", "HankenGrotesk-Latin-Medium.ttf", 500, "hankengrotesk/HankenGrotesk[wght].ttf", "HankenGrotesk-OFL.txt"),
    ("HankenGrotesk.ttf", "HankenGrotesk-Latin-SemiBold.ttf", 600, "hankengrotesk/HankenGrotesk[wght].ttf", "HankenGrotesk-OFL.txt"),
    ("HankenGrotesk-Italic.ttf", "HankenGrotesk-Latin-Italic.ttf", 400, "hankengrotesk/HankenGrotesk-Italic[wght].ttf", "HankenGrotesk-OFL.txt"),
]
for src_name, output_name, weight, upstream, license_name in specs:
    src = source / src_name
    font = TTFont(src, recalcTimestamp=False)
    if weight is not None:
        font = instantiateVariableFont(font, {"wght": weight}, inplace=True)
    options = subset.Options()
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    options.recalc_timestamp = False
    subsetter = subset.Subsetter(options=options)
    # Latin, accents, punctuation, arrows and symbols; not a Japanese-language pack.
    subsetter.populate(unicodes=range(0x3000))
    subsetter.subset(font)
    family = "App Relax Zen Mincho Latin" if weight is None else "App Relax Hanken Latin"
    style = output_name.removesuffix(".ttf").split("-")[-1]
    for name_id, value in {1: family, 2: style, 3: family + " " + style + " M6", 4: family + " " + style, 6: family.replace(" ", "") + "-" + style, 16: family, 17: style}.items():
        for platform, encoding, language in [(3, 1, 0x409), (1, 0, 0)]:
            font["name"].setName(value, name_id, platform, encoding, language)
    path = target / output_name
    font.save(path)
    data = path.read_bytes()
    entries.append({
        "file": output_name, "bytes": len(data),
        "sha256": hashlib.sha256(data).hexdigest(),
        "sourceUrl": f"https://github.com/google/fonts/blob/{commit}/ofl/{upstream}",
        "sourceSha256": hashlib.sha256(src.read_bytes()).hexdigest(),
        "license": license_name, "weight": weight or 400,
        "coverage": "Available codepoints below U+3000; static, subset derivative",
    })
(target / "manifest.json").write_text(json.dumps({"schemaVersion": 1, "assets": entries}, indent=2) + "\n")
print(f"M6 fonts: {len(entries)} static fonts, {sum(x['bytes'] for x in entries)} bytes")
