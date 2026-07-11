# GrowEasy CRM CSV Importer

[![Frontend CI/CD](https://github.com/rupamghosh2006/groweasy-csv-importer/actions/workflows/frontend.yml/badge.svg)](https://github.com/rupamghosh2006/groweasy-csv-importer/actions/workflows/frontend.yml)
[![Server CI/CD](https://github.com/rupamghosh2006/groweasy-csv-importer/actions/workflows/server.yml/badge.svg)](https://github.com/rupamghosh2006/groweasy-csv-importer/actions/workflows/server.yml)

AI-powered CSV importer that maps lead exports from different sources into a fixed GrowEasy CRM schema.

The application lets users upload a CSV, preview the parsed rows, confirm the import, and receive normalized CRM records generated with Groq AI. Rows without an email or mobile number are skipped with a clear reason.

## Quick Navigation

| Need | Section |
| --- | --- |
| Live app and repository links | [Links](#links) |
| Main product features | [Features](#features) |
| Tech stack overview | [Tech Stack](#tech-stack) |
| Folder layout | [Project Structure](#project-structure) |
| Run locally without Docker | [Local Setup](#local-setup) |
| Run full stack with Docker | [Docker Setup](#docker-setup) |
| Backend request/response contract | [API](#api) |
| CRM output fields and mapping rules | [CRM Schema](#crm-schema) |
| Sample CSV files | [Sample Data](#sample-data) |
| Build and type checks | [Quality Checks](#quality-checks) |
| Hosted deployment details | [Deployment](#deployment) |

## Links

| Resource | URL |
| --- | --- |
| Frontend | https://groweasy-csv-importer-six-beta.vercel.app |
| Backend API | https://groweasy-csv-importer-yi3v.onrender.com |
| Repository | https://github.com/rupamghosh2006/groweasy-csv-importer |

## Features

- CSV upload with drag-and-drop and file picker support
- Client-side CSV preview before AI processing
- AI field mapping for varied CSV formats and column names
- Batch processing with concurrency and retry handling
- Skipped-record reporting for rows without contact details
- Mapped CRM result table with CSV export
- Responsive UI with dark mode
- Stateless backend with no database dependency

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Node.js, Express 5, TypeScript |
| AI | Groq Llama 3.3 70B via OpenAI-compatible SDK |
| CSV parsing | PapaParse |
| Deployment | Vercel frontend, Render backend |
| CI/CD | GitHub Actions |

## Project Structure

```text
groweasy/
  frontend/          Next.js application
  server/            Express API
  samples/           Sample CSV files for manual testing
  assets/            Project assets
  docker-compose.yml Docker setup for local full-stack runs
  .github/workflows/ GitHub Actions workflows
```

## Local Setup

### Prerequisites

- Node.js 22 recommended
- Groq API key from https://console.groq.com

### Backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Set the backend environment variables in `server/.env`:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=3001
BATCH_SIZE=25
CONCURRENCY=2
MAX_RETRIES=2
```

The backend runs at `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set the frontend environment variable in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

The frontend runs at `http://localhost:3000`.

## Docker Setup

Use Docker to run the frontend and backend together in production mode.

```bash
cp .env.example .env
```

Update `.env` with your Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Start both containers:

```bash
docker compose up --build
```

The app will be available at:

| Service | URL |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:3001 |

Stop the containers:

```bash
docker compose down
```

If you change `NEXT_PUBLIC_API_URL`, rebuild the frontend image because Next.js bundles public environment variables during build.

## API

### `POST /api/import`

Accepts parsed CSV rows as JSON.

```json
{
  "rows": [
    {
      "Full Name": "John Doe",
      "Email": "john@example.com",
      "Phone": "+91 9876543210"
    }
  ]
}
```

Returns imported CRM records, skipped rows, and totals.

```json
{
  "imported": [
    {
      "created_at": "",
      "name": "John Doe",
      "email": "john@example.com",
      "country_code": "+91",
      "mobile_without_country_code": "9876543210",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [],
  "totalImported": 1,
  "totalSkipped": 0,
  "totalRows": 1
}
```

Validation:

- Request body must be `{ "rows": [...] }`
- Maximum import size is 5000 rows
- Rows without email and mobile are returned in `skipped`
- `crm_status` is limited to `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, or `SALE_DONE`
- `data_source` is limited to `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, or `sarjapur_plots`

## CRM Schema

The AI maps source data into these fields:

```text
created_at
name
email
country_code
mobile_without_country_code
company
city
state
country
lead_owner
crm_status
crm_note
data_source
possession_time
description
```

Mapping rules:

- Use the first email and first mobile number as primary contact details
- Put extra emails, extra phone numbers, remarks, and unmapped useful data in `crm_note`
- Leave fields blank when the source row does not provide enough evidence
- Do not fabricate missing values
- Keep each mapped record CSV-safe

## Sample Data

Use the files in `samples/` for manual testing:

```text
samples/facebook-leads-export.csv
samples/google-ads-export.csv
samples/messy-manual-sheet.csv
```

## Quality Checks

Run these before pushing changes:

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd server
npx tsc --noEmit
npm run build
```

## Deployment

### Frontend: Vercel

- Root directory: `frontend`
- Build command: `npm run build`
- Environment variable:

```env
NEXT_PUBLIC_API_URL=https://groweasy-csv-importer-yi3v.onrender.com
```

### Backend: Render

- Root directory: `server`
- Build command: `npm install && npx tsc`
- Start command: `node dist/index.js`
- Environment variables:

```env
GROQ_API_KEY=your_groq_api_key_here
PORT=10000
NODE_VERSION=18
```

## CI/CD

GitHub Actions workflows are defined in `.github/workflows/`.

- `frontend.yml` runs install, lint, build, and production Vercel deploy on `master`
- `server.yml` runs install, TypeScript checks, build, and triggers Render deploy on `master`

Required GitHub repository secrets:

```text
VERCEL_TOKEN
RENDER_DEPLOY_HOOK_URL
```

If using Vercel CLI deployment without a committed `.vercel/project.json`, also configure:

```text
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

## Limitations

- No database persistence; results are returned in the response and can be exported as CSV
- Maximum request size is 5000 rows
- AI output can vary, so the backend validates enum fields and retries malformed responses
- Groq free-tier rate limits may require lower concurrency for large imports
