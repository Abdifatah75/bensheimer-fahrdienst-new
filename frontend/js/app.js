const API_URL = "http://localhost:8000/api/calculate";
const weekdays = ["MO", "DI", "MI", "DO", "FR", "SA", "SO"];

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

function buildHeinrikaRows() {
  const container = document.getElementById("heinrikaRows");

  container.innerHTML = Array.from({ length: 31 }, (_, index) => {
    const number = index + 1;
    const weekday = weekdays[index % weekdays.length];

    return `
      <article class="entry-row heinrika-row">
        ${createField("Datum", `<input type="text" name="heinrikaDatum${number}" placeholder="tt.mm.jjjj" />`)}
        <div class="day-cell">
          <strong>${number}</strong>
          <span>${weekday}</span>
        </div>
        ${createField("Mitgefahren?", `
          <select name="heinrikaMitgefahren${number}">
            <option>Nein</option>
            <option>Ja</option>
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
    schulfahrt: Array.from({ length: 31 }, (_, index) => {
      const number = index + 1;

      return {
        datum: readValue(formData, `heinrikaDatum${number}`),
        tag: number,
        mitgefahren: readValue(formData, `heinrikaMitgefahren${number}`),
      };
    }),
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

buildWorkFuelRows();
buildPrivateFuelRows();
buildHeinrikaRows();
buildDeductionRows();

document.getElementById("statementForm").addEventListener("submit", calculateStatement);
document.getElementById("calculateButton").addEventListener("click", calculateStatement);
