"""
各サイトのスクリーンショットを撮って static/img/<id>.png に保存する。

ヘッドレス Chrome を使うので、Chrome があれば追加インストール不要。

実行:
    python scripts/take_screenshots.py
"""
import json
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITES_JSON = ROOT / "data" / "sites.json"
IMG_DIR = ROOT / "static" / "img"
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

WIDTH = 1600
HEIGHT = 900


def collect_sites():
    with SITES_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)
    sites = []
    if "sections" in data:
        for section in data["sections"]:
            sites.extend(section.get("sites", []))
    else:
        sites.extend(data.get("sites", []))
    return sites


def take_screenshot(url: str, output: Path) -> bool:
    output.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        CHROME,
        "--headless=new",
        "--disable-gpu",
        "--hide-scrollbars",
        f"--window-size={WIDTH},{HEIGHT}",
        f"--screenshot={output}",
        "--virtual-time-budget=20000",  # JS 等が完了するのを最大 20 秒待つ
        url,
    ]
    try:
        result = subprocess.run(
            cmd, capture_output=True, timeout=120, text=True
        )
        if output.exists() and output.stat().st_size > 1000:
            return True
        print(f"  STDERR: {result.stderr[:300]}")
        return False
    except subprocess.TimeoutExpired:
        print("  タイムアウト")
        return False


def main():
    sites = collect_sites()
    print(f"対象: {len(sites)} サイト")
    print(f"出力先: {IMG_DIR}")
    print()

    success = 0
    for site in sites:
        sid = site["id"]
        url = site["url"]
        output = IMG_DIR / f"{sid}.png"
        print(f"[{sid}] {url}")
        if take_screenshot(url, output):
            size_kb = output.stat().st_size / 1024
            print(f"  保存: {output.name} ({size_kb:.0f} KB)")
            success += 1
        else:
            print(f"  失敗")
        time.sleep(1)
        print()

    print(f"完了: {success}/{len(sites)}")


if __name__ == "__main__":
    main()
