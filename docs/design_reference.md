# Design Reference — Bensheimer Fahrdienst

Status: This document is the visual and UX source of truth for the future implementation. It does not change backend logic or app behavior.

## 1. Design Intent

The UI should feel premium, polished, and compact, inspired by a modern chauffeur / taxi service brand rather than a generic accounting dashboard.

Core visual principles:
- Dark navy / black background
- Gold / yellow accent color for highlights and primary actions
- Centered BF logo and centered page title
- Rounded dark cards with clean spacing
- Clean, minimal input fields
- Mobile-friendly layout
- No dashboard clutter
- No charts by default

## 2. Page Structure

The page should be organized as a single, scrollable form with clearly separated sections. The experience should feel calm and focused, not overloaded.

Suggested overall flow:
1. Header
2. Angaben
3. Wochenumsätze
4. Benzin Quittungen / Arbeit
5. Benzin Privat
6. Heinrika
7. Abzüge
8. Calculate button
9. Result section (shown only after calculation)

## 3. Header

The top of the page should feel premium and centered.

Required elements:
- BF logo centered
- Brand name: Bensheimer Fahrdienst
- Subtitle: Monatliche Fahrerabrechnung
- Supporting line: Monat für Monat. Klar berechnet.

Visual treatment:
- Strong center alignment
- Minimal spacing above and below the header
- Accent color used sparingly for the title and supporting line

## 4. Main Sections

### 4.1 Angaben

This section collects the basic input values for the calculation.

Fields:
- Fahrername
- Monat
- Jahr
- Fahreranteil (%)
- Heinrika-Pauschale (€/Tag)

Design notes:
- Use a clean form layout with labeled inputs
- Keep the section compact and visually balanced
- Prefer a premium, understated form style over a heavy data-entry appearance

### 4.2 Wochenumsätze

This section should present a fixed weekly table with five rows only.

Required structure:
- Exactly 5 fixed weekly rows
- Labels: Woche 1 to Woche 5
- Columns:
  - Woche / Zeitraum
  - Umsatz mit Trinkgeld (€)
  - Trinkgeld (€)
  - Barzahlung (€)

Important design rule:
- No “Woche hinzufügen” button should appear in the final design

### 4.3 Benzin Quittungen / Arbeit

This section should look like a prepared expense table for work-related fuel receipts.

Required structure:
- Prepared rows for work fuel receipts
- Ideally 31 rows
- Columns:
  - Datum
  - Bemerkung / Tankstelle
  - Betrag (€)
  - Zahlungsart

Important design rule:
- No “Quittung hinzufügen” button should appear in the final design

### 4.4 Benzin Privat

This section should capture private fuel and private vehicle use that is deducted from the salary.

Required structure:
- About 10 prepared rows
- Columns:
  - Datum
  - Fahrt / Ort / Bemerkung
  - Betrag (€)

Important design rule:
- No “Fahrt hinzufügen” button should appear in the final design

### 4.5 Heinrika

This section should be a compact, prepared daily table.

Required structure:
- 31 prepared day rows
- Columns:
  - Datum
  - Tag
  - Mitgefahren?

Interaction requirement:
- “Mitgefahren?” must be a dropdown with the options:
  - Ja
  - Nein

Important design rule:
- No “Tag hinzufügen” button should appear in the final design

### 4.6 Abzüge

This section should list recurring deductions in a simple table.

Required structure:
- About 10 prepared rows
- Columns:
  - Bezeichnung
  - Betrag (€)

Important design rule:
- No “Abzug hinzufügen” button should appear in the final design

## 5. Calculate Action

The primary action should be a single, prominent gold button.

Required label:
- Abrechnung berechnen

Design notes:
- Large, high-contrast button
- Gold / yellow accent
- Strong visual hierarchy
- Positioned clearly below the input sections

## 6. Result Section

The result should remain hidden until the calculation is performed.

When shown, it should present:
- A large Nettolohn card
- A compact Aufschlüsselung section
- A secondary PDF export area that is collapsible
- Details hidden by default

Design notes:
- The result should feel like a polished outcome card, not a dashboard panel
- Keep the breakdown compact and scannable
- PDF export should be secondary, not dominant

## 7. Interaction and UX Notes

- The form should feel lightweight and focused
- Inputs should be neatly aligned and easy to scan on mobile
- Section spacing should be generous enough to avoid clutter
- The page should avoid visual noise, extra controls, and unnecessary widgets
- The user should not be distracted by charts or analytics elements in the default view

## 8. Reference Screenshots

The visual direction should be based on the Lovable screenshots in the design screenshots folder:
- lovable_01_header_angaben.png
- lovable_02_wochenumsaetze.png
- lovable_03_benzin_quittungen_arbeit.png
- lovable_04_benzin_privat.png
- lovable_05_heinrika_abzuege.png
- lovable_06_berechnen_button.png
