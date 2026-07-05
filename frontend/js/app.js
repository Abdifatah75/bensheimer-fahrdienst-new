const API_URL = "/api/calculate";
const PDF_URL = "/api/pdf";
const MONTH_SAVE_URL = "/api/months/save";
const MONTHS_URL = "/api/months";
const THEME_KEY = "bf-theme";
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
let weekRowCount = 0;
let workFuelRowCount = 0;
let privateFuelRowCount = 0;
let deductionRowCount = 0;

function createField(label, inputHtml) {
  return `
    <label class="field">
      <span>${label}</span>
      ${inputHtml}
    </label>
  `;
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

function formatEuro(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value || 0));
}

function setTheme(theme) {
  const selected = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = selected;
  localStorage.setItem(THEME_KEY, selected);

  const button = document.getElementById("themeToggle");
  if (button) {
    button.textContent = selected === "light" ? "☀️ Light" : "🌙 Dark";
  }
}

function initializeTheme() {
  setTheme(localStorage.getItem(THEME_KEY) || "dark");
}

function toggleTheme() {
  setTheme(document.body.dataset.theme === "light" ? "dark" : "light");
}

function addWeeklyRow(row = {}) {
  const container = document.getElementById("weeklyRows");
  if (!container) return;

  weekRowCount += 1;
  const number = weekRowCount;
  container.insertAdjacentHTML(
    "beforeend",
    `
      <article class="entry-row weekly-row">
        <strong>Woche ${number}</strong>
        ${createField("Woche / Zeitraum", `<input type="text" name="woche${number}Zeitraum" value="${row.zeitraum || `Woche ${number}`}" />`)}
        ${createField("Umsatz mit Trinkgeld (€)", `<input type="number" name="woche${number}Umsatz" step="0.01" value="${row.umsatz_mit_trinkgeld || ""}" />`)}
        ${createField("Trinkgeld (€)", `<input type="number" name="woche${number}Trinkgeld" step="0.01" value="${row.trinkgeld || ""}" />`)}
        ${createField("Barzahlung (€)", `<input type="number" name="woche${number}Barzahlung" step="0.01" value="${row.barzahlung || ""}" />`)}
      </article>
    `,
  );
}

function resetWeeklyRows() {
  const container = document.getElementById("weeklyRows");
  if (!container) return;

  weekRowCount = 0;
  container.innerHTML = "";
  addWeeklyRow();
}
function addWorkFuelRow(value = "") {
  const container = document.getElementById("workFuelRows");
  if (!container) return;

  workFuelRowCount += 1;
  const number = workFuelRowCount;
  container.insertAdjacentHTML(
    "beforeend",
    `
      <article class="entry-row amount-row work-row">
        <strong>#${number}</strong>
        ${createField("Betrag (€)", `<input type="number" name="arbeitBetrag${number}" step="0.01" value="${value}" />`)}
      </article>
    `,
  );
}

function addPrivateFuelRow(value = "") {
  const container = document.getElementById("privateFuelRows");
  if (!container) return;

  privateFuelRowCount += 1;
  const number = privateFuelRowCount;
  container.insertAdjacentHTML(
    "beforeend",
    `
      <article class="entry-row amount-row private-row">
        <strong>#${number}</strong>
        ${createField("Betrag (€)", `<input type="number" name="privatBetrag${number}" step="0.01" value="${value}" />`)}
      </article>
    `,
  );
}

function addDeductionRow(row = {}) {
  const container = document.getElementById("deductionRows");
  if (!container) return;

  deductionRowCount += 1;
  const number = deductionRowCount;
  container.insertAdjacentHTML(
    "beforeend",
    `
      <article class="entry-row deduction-row">
        <strong>#${number}</strong>
        ${createField("Bezeichnung", `<input type="text" name="abzugBezeichnung${number}" value="${row.bezeichnung || ""}" />`)}
        ${createField("Betrag (€)", `<input type="number" name="abzugBetrag${number}" step="0.01" value="${row.betrag || ""}" />`)}
      </article>
    `,
  );
}

function resetOptionalRows() {
  workFuelRowCount = 0;
  privateFuelRowCount = 0;
  deductionRowCount = 0;
  document.getElementById("workFuelRows").innerHTML = "";
  document.getElementById("privateFuelRows").innerHTML = "";
  document.getElementById("deductionRows").innerHTML = "";
  addWorkFuelRow();
  addPrivateFuelRow();
  addDeductionRow();
}

function formatDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function selectedMonthIndex() {
  const value = document.getElementById("monthSelect")?.value || "";

  return monthNames.indexOf(value);
}

function selectedYear() {
  const year = Number.parseInt(document.getElementById("yearInput")?.value, 10);

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

  if (monthSelect && !monthSelect.value) {
    monthSelect.value = monthNames[now.getMonth()];
  }

  if (yearInput && !yearInput.value) {
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
  if (!container) return;

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

function collectPayload() {
  const form = document.getElementById("statementForm");
  const formData = new FormData(form);

  return {
    fahrername: readValue(formData, "fahrername"),
    monat: readValue(formData, "monat"),
    jahr: readMoney(formData, "jahr"),
    fahreranteil: readMoney(formData, "fahreranteil"),
    schulfahrt_pauschale: readMoney(formData, "heinrikaPauschale"),
    wochenumsaetze: Array.from(document.querySelectorAll("#weeklyRows .weekly-row")).map((row, index) => {
      const number = index + 1;

      return {
        zeitraum: readValue(formData, `woche${number}Zeitraum`) || `Woche ${number}`,
        umsatz_mit_trinkgeld: readMoney(formData, `woche${number}Umsatz`),
        trinkgeld: readMoney(formData, `woche${number}Trinkgeld`),
        barzahlung: readMoney(formData, `woche${number}Barzahlung`),
      };
    }),
    benzin_arbeit: Array.from(document.querySelectorAll('#workFuelRows input[name^="arbeitBetrag"]')).map((input) => ({
      datum: "",
      bemerkung: "",
      betrag: readNumber(input.value),
      zahlungsart: "Barzahlung",
    })),
    benzin_privat: Array.from(document.querySelectorAll('#privateFuelRows input[name^="privatBetrag"]')).map((input) => ({
      datum: "",
      bemerkung: "",
      betrag: readNumber(input.value),
    })),
    schulfahrt: Array.from(document.querySelectorAll("#heinrikaRows .heinrika-row[data-date]")).map((row) => ({
      datum: row.dataset.date,
      tag: Number.parseInt(row.dataset.day, 10),
      mitgefahren: row.querySelector("select")?.value || "Nein",
    })),
    abzuege: Array.from({ length: deductionRowCount }, (_, index) => {
      const number = index + 1;

      return {
        bezeichnung: readValue(formData, `abzugBezeichnung${number}`),
        betrag: readMoney(formData, `abzugBetrag${number}`),
      };
    }),
  };
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
  document.getElementById("errorMessage").textContent = "Berechnung nicht möglich. Bitte Verbindung prüfen und erneut versuchen.";
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
  const status = document.getElementById("storageStatus");

  if (status) {
    status.textContent = message;
  }
}

function filenameFromResponse(response) {
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);

  return match ? match[1] : "Abrechnung.pdf";
}

async function calculateStatement(event) {
  event?.preventDefault();

  const buttons = [document.getElementById("calculateButton"), document.getElementById("stickyCalculateButton")].filter(Boolean);
  buttons.forEach((button) => { button.disabled = true; });

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
    console.error("Calculate API failed", error);
    showApiError();
  } finally {
    buttons.forEach((button) => { button.disabled = false; });
  }
}

async function refreshSavedMonths(selectedId = "") {
  const select = document.getElementById("savedMonthSelect");

  if (!select) {
    return;
  }

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
    select.innerHTML = `<option value="">Speicher optional / nicht erreichbar</option>`;
  }
}

async function saveCurrentMonth(event) {
  event?.preventDefault();

  const button = document.getElementById("saveMonthButton");
  if (button) {
    button.disabled = true;
  }

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
    if (button) {
      button.disabled = false;
    }
  }
}

function fillWeeklyRows(rows = []) {
  const container = document.getElementById("weeklyRows");
  if (!container) return;

  weekRowCount = 0;
  container.innerHTML = "";

  rows.forEach((row) => {
    const hasValue = (row.zeitraum || "").trim()
      || readNumber(String(row.umsatz_mit_trinkgeld || "")) > 0
      || readNumber(String(row.trinkgeld || "")) > 0
      || readNumber(String(row.barzahlung || "")) > 0;

    if (hasValue) {
      addWeeklyRow(row);
    }
  });

  if (weekRowCount === 0) {
    addWeeklyRow();
  }
}

function fillAmountRows(rows = [], addRow, amountKey = "betrag") {
  rows.forEach((row) => {
    if (readNumber(String(row[amountKey] || "")) > 0) {
      addRow(row[amountKey]);
    }
  });
}

function fillDeductionRows(rows = []) {
  rows.forEach((row) => {
    if ((row.bezeichnung || "").trim() || readNumber(String(row.betrag || "")) > 0) {
      addDeductionRow(row);
    }
  });
}

function loadMonthIntoForm(month) {
  setInputValue("fahrername", month.fahrername || "");
  setInputValue("monat", month.monat || "");
  setInputValue("jahr", month.jahr || "");
  setInputValue("fahreranteil", month.fahreranteil || "");
  setInputValue("heinrikaPauschale", month.schulfahrt_pauschale || "");

  document.getElementById("weeklyRows").innerHTML = "";
  document.getElementById("workFuelRows").innerHTML = "";
  document.getElementById("privateFuelRows").innerHTML = "";
  document.getElementById("deductionRows").innerHTML = "";
  weekRowCount = 0;
  workFuelRowCount = 0;
  privateFuelRowCount = 0;
  deductionRowCount = 0;

  fillWeeklyRows(month.wochenumsaetze || []);
  fillAmountRows(month.benzin_arbeit || [], addWorkFuelRow);
  fillAmountRows(month.benzin_privat || [], addPrivateFuelRow);
  fillDeductionRows(month.abzuege || []);
  if (workFuelRowCount === 0) addWorkFuelRow();
  if (privateFuelRowCount === 0) addPrivateFuelRow();
  if (deductionRowCount === 0) addDeductionRow();

  buildHeinrikaRows(month.schulfahrt || []);

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
  event?.preventDefault();

  const select = document.getElementById("savedMonthSelect");
  if (!select?.value) {
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
  event?.preventDefault();

  const select = document.getElementById("savedMonthSelect");
  if (!select?.value) {
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
  event?.preventDefault();

  const button = document.getElementById("pdfButton");
  if (button) {
    button.disabled = true;
  }

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
    console.error("PDF API failed", error);
    showPdfError();
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

function onClick(id, handler) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener("click", handler);
  }
}

function onInput(id, eventName, handler) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function initializeApp() {
  initializeTheme();
  resetWeeklyRows();
  resetOptionalRows();
  initializeDateControls();
  buildHeinrikaRows();
  refreshSavedMonths();

  onClick("themeToggle", toggleTheme);
  onInput("monthSelect", "change", () => buildHeinrikaRows());
  onInput("yearInput", "input", () => buildHeinrikaRows());
  onClick("addWeekButton", () => addWeeklyRow());
  onClick("addWorkFuelButton", () => addWorkFuelRow());
  onClick("addPrivateFuelButton", () => addPrivateFuelRow());
  onClick("addDeductionButton", () => addDeductionRow());
  onClick("saveMonthButton", saveCurrentMonth);
  onClick("loadMonthButton", loadSelectedMonth);
  onClick("deleteMonthButton", deleteSelectedMonth);
  onInput("statementForm", "submit", calculateStatement);
  onClick("calculateButton", calculateStatement);
  onClick("stickyCalculateButton", calculateStatement);
  onClick("pdfButton", downloadPdf);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeApp);
} else {
  initializeApp();
}


