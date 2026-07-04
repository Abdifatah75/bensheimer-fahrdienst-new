# BensheimerFahrdienst_New

New clean project structure for Bensheimer Fahrdienst monthly payroll app.

## Structure

- backend/ = Python backend, formula, PDF, storage
- frontend/ = HTML, CSS, JavaScript UI
- data/ = saved data
- docs/ = documentation
- tests/ = formula tests
- old_reference/ = notes from old project

## Important

The old working formula must stay correct.

Reference result:
- Umsatz: 5.905,37 €
- Provision / Fahreranteil: 2.362,15 €
- Abzüge: 1.133,74 €
- Nettolohn: 692,44 €

## Start App

From the project root, run:

```powershell
.\start_app.ps1
```

The script starts:
- FastAPI backend at `http://127.0.0.1:8000`
- Frontend static server at `http://127.0.0.1:5500`

It then opens the frontend in your browser. Keep the two opened PowerShell windows running while using the app.
