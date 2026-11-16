import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateFirstYearTotal,
  calculateWindowTotal,
  hasFullYearCoverage,
} from "../src/lib/tariff-calculations.ts";

const DAY = 24 * 60 * 60 * 1000;
const YEAR = 365 * DAY;
const end = Date.UTC(2026, 0, 1);
const start = end - YEAR;

const tariff = (mantenimientoPrecio) => ({
  nombreTarifa: "Test",
  energiaLlana: 0.1,
  energiaPunta: 0.1,
  energiaValle: 0.1,
  potenciaPunta: 0.1,
  potenciaValle: 0.1,
  mantenimientoPrecio,
  descuento: { tipo: "fijo", valor: 10, meses: 5 },
});

test("fixed discounts are monthly and independent from price guarantee duration", () => {
  const totals = [5, 10, 12, 36, null].map((guarantee) =>
    calculateFirstYearTotal(tariff(guarantee), 1200)
  );
  assert.deepEqual(totals, [1150, 1150, 1150, 1150, 1150]);
});

test("unknown discount duration does not produce a first-year total", () => {
  const details = tariff(12);
  details.descuento = { tipo: "fijo", valor: 10, meses: null };
  assert.equal(calculateFirstYearTotal(details, 1200), undefined);
});

test("a full year of contiguous readings covers the annual window", () => {
  const readings = [
    { startDate: start, endDate: start + YEAR / 2 },
    { startDate: start + YEAR / 2, endDate: end },
  ];
  assert.equal(hasFullYearCoverage(readings, start, end), true);
});

test("a partial year or a gap does not count as full coverage", () => {
  assert.equal(
    hasFullYearCoverage([{ startDate: start + DAY, endDate: end }], start, end),
    false
  );
  assert.equal(
    hasFullYearCoverage(
      [
        { startDate: start, endDate: start + YEAR / 2 - DAY },
        { startDate: start + YEAR / 2, endDate: end },
      ],
      start,
      end
    ),
    false
  );
});

test("window totals prorate invoices crossing the annual boundaries", () => {
  const total = calculateWindowTotal(
    [{ startDate: start - 10 * DAY, endDate: start + 10 * DAY, amount: 200 }],
    start,
    end,
    (invoice) => invoice.amount
  );
  assert.equal(total, 100);
});
