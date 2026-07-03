import pandas as pd


def euro(value: float) -> str:
    s = f"{float(value):,.2f}"
    s = s.replace(",", "X").replace(".", ",").replace("X", ".")
    return f"{s} €"


def default_wochen() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "Zeitraum": ["Woche 1", "Woche 2", "Woche 3", "Woche 4", "Woche 5"],
            "Umsatz m. Trinkgeld (€)": [1567.19, 1574.58, 1542.79, 1220.81, 0.0],
            "Trinkgeld (€)": [32.0, 31.0, 21.0, 10.0, 0.0],
            "Barzahlung (€)": [445.45, 537.93, 529.92, 574.08, 0.0],
        }
    )


def default_benzin() -> pd.DataFrame:
    barzahlung = [
        30.03,
        54.38,
        30.39,
        56.08,
        55.61,
        53.34,
        48.91,
        45.18,
        49.60,
        45.79,
        52.68,
        52.65,
        62.37,
        44.02,
        53.97,
        20.07,
        57.71,
        43.17,
        41.82,
        56.18,
        42.75,
        44.77,
        7.00,
        7.00,
        46.13,
        49.81,
    ]
    return pd.DataFrame(
        {
            "Datum": ["" for _ in barzahlung] + ["", ""],
            "Bemerkung": ["" for _ in barzahlung] + ["Frankfurt", "Lampertheim"],
            "Betrag (€)": barzahlung + [40.0, 35.0],
            "Zahlungsart": ["Barzahlung"] * len(barzahlung) + ["Privat", "Privat"],
        }
    )


def default_heinrika() -> pd.DataFrame:
    ja_tage = {1, 4, 5, 6, 7, 8, 11, 12, 13, 14, 15, 18, 19, 20, 21, 22}
    return pd.DataFrame(
        {
            "Tag": list(range(1, 32)),
            "Mitgefahren?": ["Ja" if t in ja_tage else "Nein" for t in range(1, 32)],
        }
    )


def default_abzuege() -> pd.DataFrame:
    return pd.DataFrame(
        {
            "Bezeichnung": [
                "Vorschuss",
                "Sozialabgaben",
                "Benzin Privat (Fahrzeug)",
                "Flughafen Fahrten",
                "Sonstige Abzüge",
            ],
            "Betrag (€)": [512.74, 350.0, 75.0, 65.0, 131.0],
            "Bemerkung": [
                "300 Bar, 212,74 Überweisung",
                "Monatliche Sozialabgaben",
                "4x nach Frankfurt, 1x Lampertheim",
                "1x Flughafen Fahrt",
                "Rest vom letzten Monat",
            ],
        }
    )


def _money(value: float) -> float:
    return round(float(value), 2)


def berechne(wochen, benzin, heinrika, abzuege, anteil_prozent, pauschale):
    w = wochen.fillna(0)
    umsatz_mit_tg = _money(w["Umsatz m. Trinkgeld (€)"].sum())
    trinkgeld = _money(w["Trinkgeld (€)"].sum())
    umsatz_ohne_tg = _money(umsatz_mit_tg - trinkgeld)
    barzahlung_ges = _money(w["Barzahlung (€)"].sum())
    fahreranteil = _money(umsatz_mit_tg * anteil_prozent / 100)

    b = benzin.fillna({"Betrag (€)": 0})
    benzin_barzahlung = _money(b.loc[b["Zahlungsart"] == "Barzahlung", "Betrag (€)"].sum())
    benzin_privat = _money(b.loc[b["Zahlungsart"] == "Privat", "Betrag (€)"].sum())

    anzahl_tage = int((heinrika["Mitgefahren?"] == "Ja").sum())
    heinrika_summe = _money(anzahl_tage * pauschale)

    summe_abzuege = _money(abzuege.fillna({"Betrag (€)": 0})["Betrag (€)"].sum())

    nettolohn = _money(
        fahreranteil
        + heinrika_summe
        - barzahlung_ges
        + benzin_barzahlung
        - summe_abzuege
    )

    return {
        "umsatz_mit_tg": umsatz_mit_tg,
        "trinkgeld": trinkgeld,
        "umsatz_ohne_tg": umsatz_ohne_tg,
        "barzahlung_ges": barzahlung_ges,
        "fahreranteil": fahreranteil,
        "benzin_barzahlung": benzin_barzahlung,
        "benzin_privat": benzin_privat,
        "anzahl_tage": anzahl_tage,
        "heinrika_summe": heinrika_summe,
        "summe_abzuege": summe_abzuege,
        "nettolohn": nettolohn,
    }


def calculate(wochen, benzin, heinrika, abzuege, anteil_prozent, pauschale):
    return berechne(
        wochen=wochen,
        benzin=benzin,
        heinrika=heinrika,
        abzuege=abzuege,
        anteil_prozent=anteil_prozent,
        pauschale=pauschale,
    )
