"""FAA JASC Code Table PDF -> kg/jasc_codes.csv (1회 실행, 결과는 커밋한다).

사용:  python kg/tools/extract_jasc.py data/JASC_Code.pdf kg/jasc_codes.csv
필요:  pip install pypdf
"""
import csv
import logging
import re
import sys
import warnings

LINE = re.compile(r"(?m)^\s*(\d{4})\s+(\S.*?)\s*$")


def parse(text):
    codes = {}
    for code, name in LINE.findall(text):
        codes.setdefault(code, re.sub(r"\s+", " ", name).strip())
    return codes


def main(pdf_path, out_path):
    import pypdf
    logging.disable(logging.CRITICAL)
    warnings.filterwarnings("ignore")
    text = "\n".join(page.extract_text() or "" for page in pypdf.PdfReader(pdf_path).pages)
    codes = parse(text)
    chapters = sorted({c[:2] for c in codes})
    chapter_name = {ch: codes.get(ch + "00", "") for ch in chapters}
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["code", "name", "chapter", "chapterName"])
        for code, name in sorted(codes.items()):
            w.writerow([code, name, code[:2], chapter_name[code[:2]]])
    print(f"{len(codes)} codes, {len(chapters)} chapters -> {out_path}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
