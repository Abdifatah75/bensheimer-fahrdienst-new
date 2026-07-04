from typing import Any

import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.calculation.formula import calculate


app = FastAPI(title="Bensheimer Fahrdienst API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class CalculationRequest(BaseModel):
    fahrername: str | None = None
    monat: str | None = None
    jahr: int | None = None
    fahreranteil: float = 0.0
    schulfahrt_pauschale: float = 0.0
    wochenumsaetze: list[dict[str, Any]] = Field(default_factory=list)
    benzin_arbeit: list[dict[str, Any]] = Field(default_factory=list)
    benzin_privat: list[dict[str, Any]] = Field(default_factory=list)
    schulfahrt: list[dict[str, Any]] = Field(default_factory=list)
    abzuege: list[dict[str, Any]] = Field(default_factory=list)


def _number(value: Any) -> float:
    if value in (None, ""):
        return 0.0

    if isinstance(value, str):
        value = value.replace(".", "").replace(",", ".") if "," in value else value

    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _work_payment_type(value: Any) -> str:
    text = str(value or "").strip().lower()

    if text in {"bar", "barzahlung"}:
        return "Barzahlung"
    if text == "privat":
        return "Privat"

    return str(value or "").strip()


def _wochen_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Zeitraum": row.get("zeitraum") or f"Woche {index + 1}",
                "Umsatz m. Trinkgeld (€)": _number(row.get("umsatz_mit_trinkgeld")),
                "Trinkgeld (€)": _number(row.get("trinkgeld")),
                "Barzahlung (€)": _number(row.get("barzahlung")),
            }
            for index, row in enumerate(rows)
        ],
        columns=[
            "Zeitraum",
            "Umsatz m. Trinkgeld (€)",
            "Trinkgeld (€)",
            "Barzahlung (€)",
        ],
    )


def _benzin_dataframe(
    arbeit_rows: list[dict[str, Any]],
    privat_rows: list[dict[str, Any]],
) -> pd.DataFrame:
    arbeit = [
        {
            "Datum": row.get("datum") or "",
            "Bemerkung": row.get("bemerkung") or "",
            "Betrag (€)": _number(row.get("betrag")),
            "Zahlungsart": _work_payment_type(row.get("zahlungsart")),
        }
        for row in arbeit_rows
    ]
    privat = [
        {
            "Datum": row.get("datum") or "",
            "Bemerkung": row.get("bemerkung") or "",
            "Betrag (€)": _number(row.get("betrag")),
            "Zahlungsart": "Privat",
        }
        for row in privat_rows
    ]

    return pd.DataFrame(
        arbeit + privat,
        columns=["Datum", "Bemerkung", "Betrag (€)", "Zahlungsart"],
    )


def _schulfahrt_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Tag": int(_number(row.get("tag")) or index + 1),
                "Mitgefahren?": row.get("mitgefahren") or "Nein",
            }
            for index, row in enumerate(rows)
        ],
        columns=["Tag", "Mitgefahren?"],
    )


def _abzuege_dataframe(rows: list[dict[str, Any]]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "Bezeichnung": row.get("bezeichnung") or "",
                "Betrag (€)": _number(row.get("betrag")),
            }
            for row in rows
        ],
        columns=["Bezeichnung", "Betrag (€)"],
    )


@app.post("/api/calculate")
def calculate_statement(payload: CalculationRequest) -> dict[str, Any]:
    result = calculate(
        wochen=_wochen_dataframe(payload.wochenumsaetze),
        benzin=_benzin_dataframe(payload.benzin_arbeit, payload.benzin_privat),
        heinrika=_schulfahrt_dataframe(payload.schulfahrt),
        abzuege=_abzuege_dataframe(payload.abzuege),
        anteil_prozent=payload.fahreranteil,
        pauschale=payload.schulfahrt_pauschale,
    )

    return {
        "fahrername": payload.fahrername,
        "monat": payload.monat,
        "jahr": payload.jahr,
        "result": result,
    }
