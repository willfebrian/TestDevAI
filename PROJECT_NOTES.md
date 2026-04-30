# Product Intelligence Center Notes

## Purpose

Product Intelligence Center is a manufacturing dashboard for reviewing production output, QC result, product detail, and traceability for Jumbo Roll and Slit Roll products.

## Current Stack

- Static SPA using plain HTML, CSS, and JavaScript.
- Entry point: `index.html` loads scripts in order.
- Runtime bootstrap: `app.js`.
- Styling: `styles.css`.
- Font: IBM Plex Sans.
- Dev visual verification uses Playwright in `devDependencies`.

## Data Flow

- Active data source is configured in `src/config.js`.
- Mock data lives in `src/data-sources/mockData.js`.
- `src/data-sources/mockDataSource.js` adapts mock data.
- `src/data-sources/apiDataSource.js` is the runtime API adapter for future backend integration.
- `src/repositories/productRepository.js` and `src/repositories/authRepository.js` are the access layer used by UI.
- Frontend should not connect directly to database.

## Mock Data

- Mock data has 50 products across January-April 2026.
- Product split: 20 Jumbo Roll and 30 Slit Roll.
- Batch format: 10 numeric digits.
- Product code format: `JR` or `SR` + 3 alphanumeric product code + `I` or `O`.
- `I` means Slitting Input.
- `O` means Finish Good.
- Jumbo Roll is always slitting input.
- Slit Roll can be slitting input only when code ends with `I`.
- Slit Roll with code ending `O` must not be used as slitting input.
- Slit Roll Movement History starts when the slit roll is formed, not from the Jumbo Roll origin.

## Demo Users

- `admin` / `admin123`
- `executive` / `exec12345`
- `qa` / `qa123456`
- `production` / `prod12345`
- `warehouse` / `wh123456`

## Manufacturing Terms

- Production Dashboard
- Production Output List
- Traceability Report
- Product Detail
- Movement History
- Material Source
- QC Detail / QC Result
- Batch No.
- Product Code
- Product Name
- Production Time
- Product Type
- Process Status
- Slitting Input
- Finish Good
- Current Location

## Completed UI Tasks

- Task 1: `PROJECT_NOTES.md` was added and compressed typography refinement was applied.
- Task 2: Collapsed Sidebar was implemented with a CSS-only approach for desktop hover/focus expansion.
- Task 3: Full QC Detail Modal was implemented. Product detail keeps 3 visible QC rows and opens all 7 QC items in a modal.
- Mobile QC modal was adjusted so the header stays visible and the QC list scrolls inside the modal.
- Mobile sidebar was adjusted to icon-only navigation to avoid horizontal text clipping.
- Production Output List pagination was added with 10 products per page for cleaner mobile use.
- Production Trend now has a date range filter and weekly chart labels use manufacturing-style `Wxx Mon YYYY`.
- Color palette was adjusted toward dark-blue/yellow corporate branding while retaining production readability, neutral surfaces, amber process accents, and clear PASS/FAIL colors.
- Remaining warm/beige surfaces were aligned to the dark-blue/yellow palette across login, toolbar, inputs, chart grid, modals, report, and QC surfaces.

## Outstanding

- No active approved outstanding task.

## Token Guidance

- Warn before large file rewrites, large reads, multi-file refactors, generated data changes, or broad UI/layout work.
- Do not execute medium/large changes without explicit ACC.
