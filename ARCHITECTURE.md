# Application Architecture

The Sales Quarterly Revenue Analyzer is an executive financial intelligence dashboard designed to help business leaders analyze, visualize, and explain regional sales performance across quarters. Users can inspect pre-loaded enterprise sales data or upload their own sales order CSV files to instantly view total revenue, unit volume, and discount rates segmented by geographic region and fiscal quarter. Beyond interactive visual charts and dynamic matrix tables, the platform features an automated executive commentary engine that analyzes Quarter-over-Quarter revenue variance (specifically Q2 to Q3), identifies the most volatile region, isolates primary unit and discount catalysts, and produces a verified, strictly constrained three-sentence narrative using Google Gemini with a deterministic mathematical fallback.

| File Path | Description |
| :--- | :--- |
| `.env.example` | Documents template environment variables required by the application, including the server-side `GEMINI_API_KEY`. |
| `.gitignore` | Specifies files and directories that Git should ignore, such as generated build artifacts and local dependencies. |
| `ARCHITECTURE.md` | Provides a high-level business overview of the platform along with a functional inventory of all project files. |
| `bun.lock` | Records exact package versions and dependency trees to guarantee reproducible software builds. |
| `index.html` | Defines the root HTML document structure, web application title, SEO metadata, and client-side mount point. |
| `metadata.json` | Configures platform-level capabilities and permissions, including server-side Gemini AI integration. |
| `package.json` | Declares project dependencies, runtime configurations, build tooling, and startup scripts. |
| `server.ts` | Hosts the Express web server that powers the application and serves the `/api/generate-summary` AI variance analysis endpoint with deterministic fallback logic. |
| `src/App.tsx` | Functions as the central dashboard layout managing dataset state, high-level KPI cards, upload workflows, and presentation components. |
| `src/components/AiSummaryCard.tsx` | Displays an executive three-sentence variance summary explaining quarterly shifts, driver metrics, and AI verification status. |
| `src/components/CsvUploader.tsx` | Provides an intuitive file upload interface enabling users to drag and drop CSV files or re-load the default sample dataset. |
| `src/components/Header.tsx` | Renders the top navigation header displaying dataset statistics, active record counts, and quick-action controls. |
| `src/components/RawDataDrawer.tsx` | Delivers an expandable, searchable, and filterable data drawer allowing stakeholders to audit individual transaction rows. |
| `src/components/RevenueChart.tsx` | Renders an interactive bar chart visualizing revenue trends across regions and quarters for quick visual comparison. |
| `src/components/RevenueTable.tsx` | Presents a comprehensive financial matrix summarizing revenue, unit volume, and average discount percentages by region and quarter. |
| `src/index.css` | Imports Tailwind CSS directives and provides global stylesheet rules for the user interface. |
| `src/main.tsx` | Serves as the React client entry point that initializes and renders the application into the web DOM. |
| `src/types.ts` | Houses TypeScript type definitions and interfaces for order records, calculation matrix structures, and API payloads. |
| `src/utils/calculations.ts` | Implements deterministic mathematical calculations for quarterly regional aggregation, percentage swings, and primary product/channel drivers. |
| `src/utils/csvParser.ts` | Parses and validates uploaded CSV text, automatically detecting column headers and formatting data into structured sales records. |
| `src/utils/sampleData.ts` | Contains a rich, realistic enterprise sales order dataset enabling immediate out-of-the-box demonstration and testing. |
| `tsconfig.json` | Configures TypeScript compiler settings, target specifications, and path aliases for the application. |
| `vite.config.ts` | Defines Vite build tooling and server plugins for React, Tailwind CSS integration, and path resolution. |
