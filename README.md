# Utang Talaan

A small, mobile-first loan tracker that runs entirely in a web browser. It stores loans in `localStorage`, calculates flat initial interest, recurring overdue interest, and payment balances, and supports JSON backup and restore. Overdue interest is 20% of the original principal per due-date-anniversary cycle, with six grace days, prorating on days 7–13, and the full charge from day 14.

## Run locally

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>. There is no build step and no paid service or account is needed.

## Test

```bash
node --test tests/calculations.test.mjs
```

The app starts with fictional sample records so its dashboard and states are easy to try. Delete them whenever you are ready to enter real records. Data is saved only in the current browser and **does not sync between devices**; use **Export backup** and **Import backup** to move it.
