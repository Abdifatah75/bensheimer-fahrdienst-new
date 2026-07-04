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

function showDemoResult() {
  const resultSection = document.getElementById("resultSection");

  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
}

buildWorkFuelRows();
buildPrivateFuelRows();
buildHeinrikaRows();
buildDeductionRows();

document.getElementById("calculateButton").addEventListener("click", showDemoResult);
