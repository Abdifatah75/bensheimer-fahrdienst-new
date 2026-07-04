from io import BytesIO
from typing import Any

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


NAVY = colors.HexColor("#0b111c")
PANEL = colors.HexColor("#f6f1e4")
GOLD = colors.HexColor("#d9a204")
TEXT = colors.HexColor("#111827")
MUTED = colors.HexColor("#5f6877")
LINE = colors.HexColor("#ded6c1")


def euro(value: Any) -> str:
    number = float(value or 0)
    formatted = f"{number:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{formatted} EUR"


def _number(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def _count_positive(rows: list[dict[str, Any]]) -> int:
    return sum(1 for row in rows if _number(row.get("betrag")) > 0)


def _sum_amount(rows: list[dict[str, Any]]) -> float:
    return round(sum(_number(row.get("betrag")) for row in rows), 2)


def _section_title(text: str, styles: dict[str, ParagraphStyle]) -> Paragraph:
    return Paragraph(text, styles["SectionTitle"])


def _summary_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[74 * mm, 45 * mm, 45 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("TEXTCOLOR", (0, 1), (-1, -1), TEXT),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.45, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (1, 1), (-1, -1), "RIGHT"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    return table


def _key_value_table(rows: list[list[str]]) -> Table:
    table = Table(rows, colWidths=[70 * mm, 94 * mm], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("TEXTCOLOR", (0, 0), (0, -1), MUTED),
                ("TEXTCOLOR", (1, 0), (1, -1), TEXT),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
                ("LINEBELOW", (0, 0), (-1, -1), 0.35, LINE),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return table


def _make_styles() -> dict[str, ParagraphStyle]:
    base = getSampleStyleSheet()
    return {
        "Title": ParagraphStyle(
            "Title",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=23,
            leading=27,
            textColor=colors.white,
            alignment=TA_CENTER,
            spaceAfter=4,
        ),
        "Subtitle": ParagraphStyle(
            "Subtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=10,
            leading=13,
            textColor=colors.HexColor("#f5d36d"),
            alignment=TA_CENTER,
        ),
        "SectionTitle": ParagraphStyle(
            "SectionTitle",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12.5,
            leading=16,
            textColor=NAVY,
            spaceBefore=10,
            spaceAfter=6,
        ),
        "Normal": ParagraphStyle(
            "Normal",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=TEXT,
        ),
        "Small": ParagraphStyle(
            "Small",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=MUTED,
        ),
        "NetLabel": ParagraphStyle(
            "NetLabel",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=11,
            textColor=colors.HexColor("#6c5600"),
            alignment=TA_CENTER,
        ),
        "NetValue": ParagraphStyle(
            "NetValue",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=24,
            leading=28,
            textColor=NAVY,
            alignment=TA_CENTER,
        ),
        "Footer": ParagraphStyle(
            "Footer",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=7.8,
            leading=10,
            textColor=MUTED,
            alignment=TA_CENTER,
        ),
        "Right": ParagraphStyle(
            "Right",
            parent=base["Normal"],
            fontName="Helvetica-Bold",
            fontSize=9,
            leading=12,
            textColor=TEXT,
            alignment=TA_RIGHT,
        ),
    }


def _draw_header_footer(canvas, doc) -> None:
    canvas.saveState()
    width, height = A4

    canvas.setFillColor(NAVY)
    canvas.rect(0, height - 38 * mm, width, 38 * mm, fill=1, stroke=0)
    canvas.setFillColor(GOLD)
    canvas.roundRect((width - 24 * mm) / 2, height - 25 * mm, 24 * mm, 13 * mm, 3 * mm, fill=1, stroke=0)
    canvas.setFillColor(NAVY)
    canvas.setFont("Helvetica-Bold", 12)
    canvas.drawCentredString(width / 2, height - 20.7 * mm, "BF")

    canvas.setStrokeColor(LINE)
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 18 * mm, width - 20 * mm, 18 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 7.5)
    canvas.drawCentredString(width / 2, 12 * mm, "Bensheimer Fahrdienst · VIP Flughafentransfer")
    canvas.drawCentredString(width / 2, 8 * mm, "Kämmererwiese 26, 64625 Bensheim · Tel. 06251 8289899")
    canvas.drawRightString(width - 20 * mm, 8 * mm, f"Seite {doc.page}")
    canvas.restoreState()


def build_pdf(payload: dict[str, Any], result: dict[str, Any]) -> bytes:
    buffer = BytesIO()
    styles = _make_styles()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=43 * mm,
        bottomMargin=23 * mm,
    )

    month = payload.get("monat") or "-"
    year = payload.get("jahr") or "-"
    driver = payload.get("fahrername") or "-"
    work_fuel = payload.get("benzin_arbeit") or []
    private_fuel = payload.get("benzin_privat") or []
    school_rows = payload.get("schulfahrt") or []
    deductions = payload.get("abzuege") or []
    school_days = sum(1 for row in school_rows if row.get("mitgefahren") == "Ja")

    story = [
        Paragraph("Bensheimer Fahrdienst", styles["Title"]),
        Paragraph("Monatliche Fahrerabrechnung", styles["Subtitle"]),
        Spacer(1, 7 * mm),
        _key_value_table(
            [
                ["Fahrername", driver],
                ["Monat / Jahr", f"{month} {year}"],
                ["Fahreranteil", f"{payload.get('fahreranteil', 0)} %"],
                ["Schulfahrt-Pauschale", euro(payload.get("schulfahrt_pauschale"))],
            ]
        ),
        Spacer(1, 7 * mm),
        Table(
            [
                [Paragraph("Nettolohn", styles["NetLabel"])],
                [Paragraph(euro(result.get("nettolohn")), styles["NetValue"])],
            ],
            colWidths=[164 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#f6d060")),
                    ("BOX", (0, 0), (-1, -1), 0.75, GOLD),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                ]
            ),
        ),
        _section_title("Aufschlüsselung", styles),
        _summary_table(
            [
                ["Position", "Wert", "Betrag"],
                ["Umsatz mit Trinkgeld", "", euro(result.get("umsatz_mit_tg"))],
                ["Trinkgeld", "", euro(result.get("trinkgeld"))],
                ["Fahreranteil", "", euro(result.get("fahreranteil"))],
                ["Barzahlung", "", euro(-result.get("barzahlung_ges", 0))],
                ["Benzin Arbeit", "", euro(result.get("benzin_barzahlung"))],
                ["Benzin Privat", "", euro(-result.get("benzin_privat", 0))],
                ["Abzüge", "", euro(-result.get("summe_abzuege", 0))],
                ["Schulfahrt", f"{result.get('anzahl_tage', 0)} Tage", euro(result.get("heinrika_summe"))],
            ]
        ),
        _section_title("Umsatz / Wochenumsätze", styles),
        _summary_table(
            [
                ["Kennzahl", "Wert", "Betrag"],
                ["Umsatz mit Trinkgeld", "", euro(result.get("umsatz_mit_tg"))],
                ["Umsatz ohne Trinkgeld", "", euro(result.get("umsatz_ohne_tg"))],
                ["Barzahlung gesamt", "", euro(result.get("barzahlung_ges"))],
            ]
        ),
        _section_title("Benzin Quittungen / Arbeit", styles),
        _summary_table(
            [
                ["Kennzahl", "Wert", "Betrag"],
                ["Erfasste Quittungen", str(_count_positive(work_fuel)), euro(_sum_amount(work_fuel))],
                ["Barzahlung erstattet", "", euro(result.get("benzin_barzahlung"))],
            ]
        ),
        _section_title("Benzin Privat", styles),
        _summary_table(
            [
                ["Kennzahl", "Wert", "Betrag"],
                ["Erfasste Privatfahrten", str(_count_positive(private_fuel)), euro(_sum_amount(private_fuel))],
                ["Vom Lohn abgezogen", "", euro(result.get("benzin_privat"))],
            ]
        ),
        _section_title("Schulfahrt", styles),
        _summary_table(
            [
                ["Kennzahl", "Wert", "Betrag"],
                ["Mitgefahrene Tage", str(school_days), euro(result.get("heinrika_summe"))],
                ["Pauschale pro Tag", "", euro(payload.get("schulfahrt_pauschale"))],
            ]
        ),
        _section_title("Abzüge", styles),
        _summary_table(
            [
                ["Kennzahl", "Wert", "Betrag"],
                ["Erfasste Abzüge", str(_count_positive(deductions)), euro(_sum_amount(deductions))],
                ["Summe Abzüge", "", euro(result.get("summe_abzuege"))],
            ]
        ),
    ]

    doc.build(story, onFirstPage=_draw_header_footer, onLaterPages=_draw_header_footer)
    return buffer.getvalue()
