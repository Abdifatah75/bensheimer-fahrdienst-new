# Formula Reference

The calculation logic is migrated from the legacy working project and must remain unchanged.

## Legacy inputs

The reference calculation uses the following legacy defaults:
- Wochenumsätze: five fixed weekly rows
- Benzin receipts: barzahlungen plus private fuel entries
- Heinrika days: 16 days marked as "Ja"
- Abzüge: the legacy deduction rows and totals

## Legacy formula behavior

The calculation uses these inputs:
- Umsatz mit Trinkgeld
- Trinkgeld
- Barzahlung
- Fahreranteil (%)
- Heinrika-Pauschale (€/Tag)
- Benzin barzahlungen
- Benzin privat
- Abzüge

The result values are produced in the same shape as the old implementation:
- Umsatz mit Trinkgeld
- Trinkgeld
- Umsatz ohne Trinkgeld
- Barzahlung gesamt
- Fahreranteil
- Benzin aus Barzahlung
- Benzin privat
- Anzahl Heinrika-Tage
- Heinrika-Gutschrift
- Summe Abzüge
- Nettolohn

## Reference result

The reference result that must pass is:
- Umsatz: 5.905,37 €
- Provision / Fahreranteil: 2.362,15 €
- Abzüge: 1.133,74 €
- Nettolohn: 692,44 €

These values are reproduced with:
- Anteil: 40.0%
- Heinrika-Pauschale: 25.0 €/Tag
