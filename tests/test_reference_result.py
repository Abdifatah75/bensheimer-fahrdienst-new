import pytest

from backend.calculation.formula import (
    calculate,
    default_abzuege,
    default_benzin,
    default_heinrika,
    default_wochen,
)


def test_reference_result_matches_legacy_example():
    wochen = default_wochen()
    benzin = default_benzin()
    heinrika = default_heinrika()
    abzuege = default_abzuege()

    result = calculate(
        wochen=wochen,
        benzin=benzin,
        heinrika=heinrika,
        abzuege=abzuege,
        anteil_prozent=40.0,
        pauschale=25.0,
    )

    assert result["umsatz_mit_tg"] == pytest.approx(5905.37)
    assert result["fahreranteil"] == pytest.approx(2362.15)
    assert result["summe_abzuege"] == pytest.approx(1133.74)
    assert result["nettolohn"] == pytest.approx(692.44)
