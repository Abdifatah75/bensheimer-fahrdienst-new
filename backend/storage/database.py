import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PROJECT_ROOT = Path(__file__).resolve().parents[2]
MONTHS_DIR = PROJECT_ROOT / "data" / "months"


def _safe_part(value: Any, fallback: str) -> str:
    text = str(value or fallback).strip() or fallback
    text = re.sub(r"[^A-Za-z0-9_-]+", "_", text)
    return text.strip("_") or fallback


def _path_for_id(month_id: str) -> Path:
    safe_id = _safe_part(month_id, "month")
    return MONTHS_DIR / f"{safe_id}.json"


def make_month_id(data: dict[str, Any]) -> str:
    return "_".join(
        [
            _safe_part(data.get("fahrername"), "Fahrer"),
            _safe_part(data.get("monat"), "Monat"),
            _safe_part(data.get("jahr"), "Jahr"),
        ]
    )


def save_month(data: dict[str, Any]) -> dict[str, Any]:
    MONTHS_DIR.mkdir(parents=True, exist_ok=True)

    month_id = make_month_id(data)
    saved = dict(data)
    saved["id"] = month_id
    saved["saved_at"] = datetime.now(timezone.utc).isoformat()

    path = _path_for_id(month_id)
    path.write_text(json.dumps(saved, ensure_ascii=False, indent=2), encoding="utf-8")

    return saved


def load_month(month_id: str) -> dict[str, Any] | None:
    path = _path_for_id(month_id)

    if not path.exists():
        return None

    return json.loads(path.read_text(encoding="utf-8"))


def list_months() -> list[dict[str, Any]]:
    if not MONTHS_DIR.exists():
        return []

    months = []
    for path in MONTHS_DIR.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue

        month_id = data.get("id") or path.stem
        months.append(
            {
                "id": month_id,
                "fahrername": data.get("fahrername") or "",
                "monat": data.get("monat") or "",
                "jahr": data.get("jahr") or "",
                "saved_at": data.get("saved_at") or "",
                "label": f"{data.get('fahrername') or 'Fahrer'} · {data.get('monat') or 'Monat'} {data.get('jahr') or ''}".strip(),
            }
        )

    return sorted(months, key=lambda item: item.get("saved_at") or "", reverse=True)


def delete_month(month_id: str) -> bool:
    path = _path_for_id(month_id)

    if not path.exists():
        return False

    path.unlink()
    return True
