# BensheimerFahrdienst_New

Clean FastAPI + static frontend project for the Bensheimer Fahrdienst monthly payroll app.

## What this app does

Drivers enter their monthly numbers, calculate the payout, download or print the PDF, and leave.

Current online scope:

- no login
- no user accounts
- no Supabase
- no database requirement for online usage
- no permanent driver data storage online
- calculate + PDF download only

The old working formula must stay correct.

Reference result:

- Umsatz: 5.905,37 EUR
- Provision / Fahreranteil: 2.362,15 EUR
- Abzuege: 1.133,74 EUR
- Nettolohn: 692,44 EUR

## Structure

- `backend/` = FastAPI backend, formula, PDF, optional local storage
- `frontend/` = static HTML, CSS, JavaScript UI
- `data/` = optional local saved months
- `docs/` = documentation
- `tests/` = formula regression tests
- `old_reference/` = notes from old project

## Local start: production-style single service

From the project root:

```powershell
.\.venv\Scripts\python.exe -m uvicorn backend.app:app --reload --host 127.0.0.1 --port 8000
```

Then open:

```text
http://127.0.0.1:8000
```

FastAPI serves the frontend from `frontend/` and the API from the same domain:

- `/`
- `/assets/...`
- `/css/style.css`
- `/js/app.js`
- `/api/calculate`
- `/api/pdf`
- `/api/health`

## Local start: old development helper

The existing helper scripts are still available:

```powershell
.\start_app.ps1
```

or double-click:

```text
start_app.bat
```

These scripts may still start backend and frontend separately for local development.

## Online deployment on Render Free

1. Push this project to GitHub.
2. Create or open your Render account.
3. Create a new Web Service from the GitHub repository.
4. Use this build command:

```bash
pip install -r requirements.txt
```

5. Use this start command:

```bash
uvicorn backend.app:app --host 0.0.0.0 --port $PORT
```

6. Deploy and open the Render URL.
7. The frontend and API run from the same FastAPI service, so no hardcoded localhost URL is needed.
8. Render Free services may sleep after inactivity and can need about one minute to wake up.
9. No login or database is required for the online version.
10. The online version is for calculation and PDF download only.

A Render Blueprint is included in `render.yaml`.

## Validation commands

```powershell
.\.venv\Scripts\python.exe -m pytest -q tests/test_reference_result.py
node --check frontend/js/app.js
.\.venv\Scripts\python.exe -m py_compile backend/app.py backend/pdf/pdf_export.py backend/storage/database.py
```

## Important

Do not change `backend/calculation/formula.py` unless the formula intentionally changes and the reference test is updated with approval.
