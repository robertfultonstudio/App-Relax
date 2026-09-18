"""Read-only ZIP accounting and byte-identity audit. No extraction or APK edits."""
import hashlib
import json
import pathlib
import sys
import zipfile
from collections import defaultdict


def digest_file(stream):
    digest = hashlib.sha256()
    for chunk in iter(lambda: stream.read(1024 * 1024), b""):
        digest.update(chunk)
    return digest.hexdigest()


def classify(name):
    if pathlib.PurePosixPath(name).suffix.lower() in {".wav", ".flac", ".aac", ".mp3", ".m4a", ".ogg", ".opus"}:
        return "audio"
    if name.startswith("lib/") and name.endswith(".so"):
        return "native_libraries"
    if (name.startswith("classes") and name.endswith(".dex")) or name == "assets/index.android.bundle":
        return "code"
    if name.startswith(("assets/", "res/")) or name == "resources.arsc":
        return "resources"
    return "other"


def audit(path):
    with path.open("rb") as stream:
        sha = digest_file(stream)
    totals = defaultdict(lambda: {"entries": 0, "compressed": 0, "uncompressed": 0})
    abis = defaultdict(int)
    groups = defaultdict(list)
    audio = []
    markers = {}
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        if sum(e.file_size for e in entries) > 8 * 1024**3 or any(e.file_size > 2 * 1024**3 for e in entries):
            raise ValueError("ZIP exceeds safety limits")
        for entry in entries:
            category = classify(entry.filename)
            row = totals[category]
            row["entries"] += 1
            row["compressed"] += entry.compress_size
            row["uncompressed"] += entry.file_size
            with archive.open(entry) as stream:
                sha256 = digest_file(stream)  # zipfile also verifies each CRC.
            if entry.file_size:
                groups[(entry.file_size, sha256)].append(entry)
            if category == "native_libraries":
                abis[entry.filename.split("/")[1]] += entry.file_size
            if category == "audio":
                audio.append({"path": entry.filename, "bytes": entry.file_size, "sha256": sha256})
            if entry.filename == "assets/index.android.bundle":
                bundle = archive.read(entry)
                markers = {m: bundle.count(m.encode()) for m in ["./audio-test.tsx", "./session/[sessionId].tsx", "./category/[categoryId].tsx", "Engine room.", "./qa-workbench.tsx"]}
        compressed = sum(e.compress_size for e in entries)
        uncompressed = sum(e.file_size for e in entries)
    duplicates = [g for g in groups.values() if len(g) > 1]
    return {
        "artifact": path.name, "sha256": sha, "apkBytes": path.stat().st_size,
        "entries": len(entries), "crc": "PASS", "compressedPayload": compressed,
        "uncompressedPayload": uncompressed, "zipOverhead": path.stat().st_size - compressed,
        "categories": dict(totals), "abiUncompressedBytes": dict(abis), "audio": audio,
        "bundleMarkers": markers,
        "duplicates": {"groups": len(duplicates), "files": sum(len(g) for g in duplicates),
            "excessUncompressed": sum(g[0].file_size * (len(g)-1) for g in duplicates),
            "excessCompressed": sum(sum(e.compress_size for e in g) - min(e.compress_size for e in g) for g in duplicates),
            "groupsAtLeast100KB": sum(g[0].file_size >= 100000 for g in duplicates)},
        "scope": "ZIP bytes, not installed footprint, memory, or a build-size forecast",
    }


if __name__ == "__main__":
    print(json.dumps(audit(pathlib.Path(sys.argv[1]).resolve(strict=True)), indent=2))
