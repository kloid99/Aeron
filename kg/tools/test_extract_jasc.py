import csv
from pathlib import Path
from extract_jasc import parse

HERE = Path(__file__).parent

def test_parse_lines():
    text = "PREFACE 2024 report\n1100 PLACARDS AND MARKINGS  \n1210 FUEL SERVICING \n1100 DUPLICATE\n"
    assert parse(text) == {"1100": "PLACARDS AND MARKINGS", "1210": "FUEL SERVICING"}

def test_generated_csv():
    rows = list(csv.DictReader(open(HERE.parent / "jasc_codes.csv", encoding="utf-8")))
    assert len(rows) == 547
    assert len({r["chapter"] for r in rows}) == 51
    codes = {r["code"]: r for r in rows}
    assert codes["7200"]["chapter"] == "72"
    assert "5330" in codes
