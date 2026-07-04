const API_BASE_URL = "http://127.0.0.1:8000";
const API_URL = `${API_BASE_URL}/api/calculate`;
const PDF_URL = `${API_BASE_URL}/api/pdf`;
const MONTH_SAVE_URL = `${API_BASE_URL}/api/months/save`;
const MONTHS_URL = `${API_BASE_URL}/api/months`;
const monthNames = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];
const weekdayNames = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];
let lastCalculatedResult = null;

function createField(label, inputHtml) {
  return `
    <label class="field">
      <span>${label}</span>
      ${inputHtml}
    </label>
  `;
}

function buildWorkFuelRows() {
  const container = document.getElementById("workFuelRows");

  container.innerHTML = Array.from({ length: 31 }, (_, index) => {
    const number = index + 1;

    return `
      <article class="entry-row work-row">
        <strong>#${number}</strong>
        ${createField("Datum", `<input type="text" name="arbeitDatum${number}" placeholder="tt.mm.jjjj" />`)}
        ${createField("Bemerkung / Tankstelle", `<input type="text" name="arbeitBemerkung${number}" placeholder="z. B. Shell A5" />`)}
        ${createField("Betrag (€)", `<input type="number" name="arbeitBetrag${number}" step="0.01" />`)}
        ${createField("Zahlungsart", `
          <select name="arbeitZahlungsart${number}">
            <option>Bar</option>
            <option>Karte</option>
            <option>Firma</option>
          </select>
        `)}
      </article>
    `;
  }).join("");
}

function buildPrivateFuelRows() {
  const container = document.getElementById("privateFuelRows");

  container.innerHTML = Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;

    return `
      <article class="entry-row private-row">
        <strong>#${number}</strong>
        ${createField("Datum", `<input type="text" name="privatDatum${number}" placeholder="tt.mm.jjjj" />`)}
        ${createField("Fahrt / Ort / Bemerkung", `<input type="text" name="privatBemerkung${number}" placeholder="z. B. Privatfahrt" />`)}
        ${createField("Betrag (€)", `<input type="number" name="privatBetrag${number}" step="0.01" />`)}
      </article>
    `;
  }).join("");
}

function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function selectedMonthIndex() {
  const value = document.getElementById("monthSelect").value;

  return monthNames.indexOf(value);
}

function selectedYear() {
  const year = Number.parseInt(document.getElementById("yearInput").value, 10);

  return Number.isInteger(year) && year >= 2020 && year <= 2100
    ? year
    : new Date().getFullYear();
}

function daysInSelectedMonth() {
  const monthIndex = selectedMonthIndex();

  if (monthIndex < 0) {
    return [];
  }

  const year = selectedYear();
  const dayCount = new Date(year, monthIndex + 1, 0).getDate();

  return Array.from({ length: dayCount }, (_, index) => new Date(year, monthIndex, index + 1));
}

function initializeDateControls() {
  const now = new Date();
  const monthSelect = document.getElementById("monthSelect");
  const yearInput = document.getElementById("yearInput");

  if (!monthSelect.value) {
    monthSelect.value = monthNames[now.getMonth()];
  }

  if (!yearInput.value) {
    yearInput.value = now.getFullYear();
  }
}

function choicesFromSchulfahrtRows(rows) {
  return rows.reduce((choices, row) => {
    if (row.datum) {
      choices[row.datum] = row.mitgefahren || "Nein";
    }

    return choices;
  }, {});
}

function currentSchulfahrtChoices() {
  return Array.from(document.querySelectorAll("#heinrikaRows .heinrika-row")).reduce((choices, row) => {
    const date = row.dataset.date;
    const select = row.querySelector("select");

    if (date && select) {
      choices[date] = select.value;
    }

    return choices;
  }, {});
}

function buildHeinrikaRows(savedRows = null) {
  const container = document.getElementById("heinrikaRows");
  const existingChoices = savedRows
    ? choicesFromSchulfahrtRows(savedRows)
    : currentSchulfahrtChoices();
  const days = daysInSelectedMonth();

  if (days.length === 0) {
    container.innerHTML = `
      <article class="entry-row heinrika-row">
        <div class="date-cell">
          <strong>Bitte Monat auswählen</strong>
          <span>Schulfahrt wird automatisch erzeugt</span>
        </div>
      </article>
    `;
    return;
  }

  container.innerHTML = days.map((date, index) => {
    const number = index + 1;
    const formattedDate = formatDate(date);
    const weekday = weekdayNames[date.getDay()];
    const selectedValue = existingChoices[formattedDate] || "Nein";

    return `
      <article class="entry-row heinrika-row" data-date="${formattedDate}" data-day="${number}" data-weekday="${weekday}">
        <div class="date-cell">
          <span>Datum</span>
          <strong>${formattedDate}</strong>
        </div>
        <div class="day-cell">
          <span>Tag</span>
          <strong>${weekday}</strong>
        </div>
        <input type="hidden" name="heinrikaDatum${number}" value="${formattedDate}" />
        ${createField("Mitgefahren?", `
          <select name="heinrikaMitgefahren${number}">
            <option${selectedValue === "Nein" ? " selected" : ""}>Nein</option>
            <option${selectedValue === "Ja" ? " selected" : ""}>Ja</option>
          </select>
        `)}
      </article>
    `;
  }).join("");
}

function buildDeductionRows() {
  const container = document.getElementById("deductionRows");

  container.innerHTML = Array.from({ length: 10 }, (_, index) => {
    const number = index + 1;

    return `
      <article class="entry-row deduction-row">
        <strong>#${number}</strong>
        ${createField("Bezeichnung", `<input type="text" name="abzugBezeichnung${number}" />`)}
        ${createField("Betrag (€)", `<input type="number" name="abzugBetrag${number}" step="0.01" />`)}
      </article>
    `;
  }).join("");
}

function readNumber(value) {
  if (!value) {
    return 0;
  }

  const normalized = value.includes(",")
    ? value.replaceAll(".", "").replace(",", ".")
    : value;
  const parsed = Number.parseFloat(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

function readValue(formData, name) {
  return String(formData.get(name) || "").trim();
}

function readMoney(formData, name) {
  return readNumber(readValue(formData, name));
}

function setInputValue(name, value) {
  const input = document.querySelector(`[name="${name}"]`);

  if (input) {
    input.value = value ?? "";
  }
}

function collectPayload() {
  const form = document.getElementById("statementForm");
  const formData = new FormData(form);

  return {
    fahrername: readValue(formData, "fahrername"),
    monat: readValue(formData, "monat"),
    jahr: readMoney(formData, "jahr"),
    fahreranteil: readMoney(formData, "fahreranteil"),
    schulfahrt_pauschale: readMoney(formData, "heinrikaPauschale"),
    wochenumsaetze: Array.from({ length: 5 }, (_, index) => {
      const number = index + 1;

      return {
        zeitraum: readValue(formData, `woche${number}Zeitraum`) || `Woche ${number}`,
        umsatz_mit_trinkgeld: readMoney(formData, `woche${number}Umsatz`),
        trinkgeld: readMoney(formData, `woche${number}Trinkgeld`),
        barzahlung: readMoney(formData, `woche${number}Barzahlung`),
      };
    }),
    benzin_arbeit: Array.from({ length: 31 }, (_, index) => {
      const number = index + 1;

      return {
        datum: readValue(formData, `arbeitDatum${number}`),
        bemerkung: readValue(formData, `arbeitBemerkung${number}`),
        betrag: readMoney(formData, `arbeitBetrag${number}`),
        zahlungsart: readValue(formData, `arbeitZahlungsart${number}`),
      };
    }),
    benzin_privat: Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;

      return {
        datum: readValue(formData, `privatDatum${number}`),
        bemerkung: readValue(formData, `privatBemerkung${number}`),
        betrag: readMoney(formData, `privatBetrag${number}`),
      };
    }),
    schulfahrt: Array.from(document.querySelectorAll("#heinrikaRows .heinrika-row[data-date]")).map((row) => ({
      datum: row.dataset.date,
      tag: Number.parseInt(row.dataset.day, 10),
      mitgefahren: row.querySelector("select")?.value || "Nein",
    })),
    abzuege: Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;

      return {
        bezeichnung: readValue(formData, `abzugBezeichnung${number}`),
        betrag: readMoney(formData, `abzugBetrag${number}`),
      };
    }),
  };
}

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function setResultVisibility({ showError }) {
  document.getElementById("resultSection").hidden = false;
  document.querySelector(".net-card").hidden = showError;
  document.querySelector(".result-card").hidden = showError;
  document.getElementById("errorMessage").hidden = !showError;
}

function renderResult(data) {
  const result = data.result || {};
  const resultMeta = [data.fahrername, data.monat, data.jahr].filter(Boolean).join(" · ");

  lastCalculatedResult = result;
  setResultVisibility({ showError: false });
  document.getElementById("errorMessage").textContent = "";
  document.getElementById("resultMeta").textContent = resultMeta || "Ergebnis";
  document.getElementById("nettolohnValue").textContent = formatEuro(result.nettolohn);
  document.getElementById("breakdownList").innerHTML = [
    ["Umsatz mit Trinkgeld", result.umsatz_mit_tg],
    ["Trinkgeld", result.trinkgeld],
    ["Fahreranteil", result.fahreranteil],
    ["Barzahlung", -result.barzahlung_ges],
    ["Benzin Arbeit", result.benzin_barzahlung],
    ["Benzin Privat", -result.benzin_privat],
    ["Abzüge", -result.summe_abzuege],
    ["Schulfahrt", result.heinrika_summe],
  ].map(([label, value]) => `<div><dt>${label}</dt><dd>${formatEuro(value)}</dd></div>`).join("");

  document.getElementById("resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function showApiError() {
  setResultVisibility({ showError: true });
  document.getElementById("errorMessage").textContent = "Backend nicht erreichbar. Bitte API starten.";
  document.getElementById("resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function showPdfError() {
  const errorMessage = document.getElementById("errorMessage");

  document.getElementById("resultSection").hidden = false;
  errorMessage.hidden = false;
  errorMessage.textContent = "PDF konnte nicht erstellt werden.";
  document.getElementById("resultSection").scrollIntoView({ behavior: "smooth", block: "start" });
}

function showStorageStatus(message) {
  document.getElementById("storageStatus").textContent = message;
}

function filenameFromResponse(response) {
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);

  return match ? match[1] : "Abrechnung.pdf";
}

async function calculateStatement(event) {
  event.preventDefault();

  const button = document.getElementById("calculateButton");
  button.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collectPayload()),
    });

    if (!response.ok) {
      throw new Error("API request failed");
    }

    renderResult(await response.json());
  } catch (error) {
    showApiError();
  } finally {
    button.disabled = false;
  }
}

async function refreshSavedMonths(selectedId = "") {
  const select = document.getElementById("savedMonthSelect");

  try {
    const response = await fetch(MONTHS_URL);

    if (!response.ok) {
      throw new Error("Could not load saved months");
    }

    const data = await response.json();
    const months = data.months || [];

    select.innerHTML = months.length
      ? months.map((month) => `<option value="${month.id}">${month.label}</option>`).join("")
      : `<option value="">Keine gespeicherten Monate</option>`;

    if (selectedId && months.some((month) => month.id === selectedId)) {
      select.value = selectedId;
    }
  } catch (error) {
    select.innerHTML = `<option value="">Speicher nicht erreichbar</option>`;
  }
}

async function saveCurrentMonth(event) {
  event.preventDefault();

  const button = document.getElementById("saveMonthButton");
  button.disabled = true;

  try {
    const response = await fetch(MONTH_SAVE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...collectPayload(),
        calculated_result: lastCalculatedResult,
      }),
    });

    if (!response.ok) {
      throw new Error("Save failed");
    }

    const data = await response.json();
    await refreshSavedMonths(data.id);
    showStorageStatus("Monat gespeichert.");
  } catch (error) {
    showStorageStatus("Monat konnte nicht gespeichert werden.");
  } finally {
    button.disabled = false;
  }
}

function fillWeeklyRows(rows = []) {
  rows.slice(0, 5).forEach((row, index) => {
    const number = index + 1;
    setInputValue(`woche${number}Zeitraum`, row.zeitraum || `Woche ${number}`);
    setInputValue(`woche${number}Umsatz`, row.umsatz_mit_trinkgeld || "");
    setInputValue(`woche${number}Trinkgeld`, row.trinkgeld || "");
    setInputValue(`woche${number}Barzahlung`, row.barzahlung || "");
  });
}

function fillWorkFuelRows(rows = []) {
  rows.slice(0, 31).forEach((row, index) => {
    const number = index + 1;
    setInputValue(`arbeitDatum${number}`, row.datum || "");
    setInputValue(`arbeitBemerkung${number}`, row.bemerkung || "");
    setInputValue(`arbeitBetrag${number}`, row.betrag || "");
    setInputValue(`arbeitZahlungsart${number}`, row.zahlungsart || "Bar");
  });
}

function fillPrivateFuelRows(rows = []) {
  rows.slice(0, 10).forEach((row, index) => {
    const number = index + 1;
    setInputValue(`privatDatum${number}`, row.datum || "");
    setInputValue(`privatBemerkung${number}`, row.bemerkung || "");
    setInputValue(`privatBetrag${number}`, row.betrag || "");
  });
}

function fillDeductionRows(rows = []) {
  rows.slice(0, 10).forEach((row, index) => {
    const number = index + 1;
    setInputValue(`abzugBezeichnung${number}`, row.bezeichnung || "");
    setInputValue(`abzugBetrag${number}`, row.betrag || "");
  });
}

function loadMonthIntoForm(month) {
  setInputValue("fahrername", month.fahrername || "");
  setInputValue("monat", month.monat || "");
  setInputValue("jahr", month.jahr || "");
  setInputValue("fahreranteil", month.fahreranteil || "");
  setInputValue("heinrikaPauschale", month.schulfahrt_pauschale || "");

  buildWorkFuelRows();
  buildPrivateFuelRows();
  buildDeductionRows();
  buildHeinrikaRows(month.schulfahrt || []);
  fillWeeklyRows(month.wochenumsaetze || []);
  fillWorkFuelRows(month.benzin_arbeit || []);
  fillPrivateFuelRows(month.benzin_privat || []);
  fillDeductionRows(month.abzuege || []);

  lastCalculatedResult = month.calculated_result || null;
  if (lastCalculatedResult) {
    renderResult({
      fahrername: month.fahrername,
      monat: month.monat,
      jahr: month.jahr,
      result: lastCalculatedResult,
    });
  } else {
    document.getElementById("resultSection").hidden = true;
  }
}

async function loadSelectedMonth(event) {
  event.preventDefault();

  const select = document.getElementById("savedMonthSelect");
  if (!select.value) {
    showStorageStatus("Bitte einen gespeicherten Monat auswählen.");
    return;
  }

  try {
    const response = await fetch(`${MONTHS_URL}/${encodeURIComponent(select.value)}`);

    if (!response.ok) {
      throw new Error("Load failed");
    }

    loadMonthIntoForm(await response.json());
    showStorageStatus("Monat geladen.");
  } catch (error) {
    showStorageStatus("Monat konnte nicht geladen werden.");
  }
}

async function deleteSelectedMonth(event) {
  event.preventDefault();

  const select = document.getElementById("savedMonthSelect");
  if (!select.value) {
    showStorageStatus("Bitte einen gespeicherten Monat auswählen.");
    return;
  }

  try {
    const response = await fetch(`${MONTHS_URL}/${encodeURIComponent(select.value)}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Delete failed");
    }

    await refreshSavedMonths();
    showStorageStatus("Monat gelöscht.");
  } catch (error) {
    showStorageStatus("Monat konnte nicht gelöscht werden.");
  }
}

async function downloadPdf(event) {
  event.preventDefault();

  const button = document.getElementById("pdfButton");
  button.disabled = true;

  try {
    const response = await fetch(PDF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collectPayload()),
    });

    if (!response.ok) {
      throw new Error("PDF request failed");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filenameFromResponse(response);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    document.getElementById("errorMessage").hidden = true;
  } catch (error) {
    showPdfError();
  } finally {
    button.disabled = false;
  }
}

buildWorkFuelRows();
buildPrivateFuelRows();
initializeDateControls();
buildHeinrikaRows();
buildDeductionRows();
refreshSavedMonths();

document.getElementById("monthSelect").addEventListener("change", () => buildHeinrikaRows());
document.getElementById("yearInput").addEventListener("input", () => buildHeinrikaRows());
document.getElementById("saveMonthButton").addEventListener("click", saveCurrentMonth);
document.getElementById("loadMonthButton").addEventListener("click", loadSelectedMonth);
document.getElementById("deleteMonthButton").addEventListener("click", deleteSelectedMonth);
document.getElementById("statementForm").addEventListener("submit", calculateStatement);
document.getElementById("calculateButton").addEventListener("click", calculateStatement);
document.getElementById("pdfButton").addEventListener("click", downloadPdf);
