# GrowEasy — AI-Powered CRM CSV Importer

Upload any CSV (Facebook Lead Ads, Google Ads, real-estate CRMs, Zoho exports, manual spreadsheets) and get its columns intelligently mapped into a fixed CRM schema using Groq AI (free tier). The core challenge solved here is **AI field mapping** — not CSV parsing.

**Live App:** https://groweasy-csv-importer-six-beta.vercel.app  
**Backend API:** https://groweasy-csv-importer-yi3v.onrender.com  
**GitHub Repo:** https://github.com/rupamghosh2006/groweasy-csv-importer  

---

## Features

- **Drag & drop CSV upload** with file validation
- **Client-side CSV preview** — see your data before importing
- **AI-powered field mapping** — Groq (Llama 3.3 70B) intelligently maps any column structure to the fixed CRM schema
- **Batch processing** — rows split into batches of 25, processed with 3-way concurrency
- **Automatic retry** — failed batches retry up to 2x with exponential backoff
- **Smart skip logic** — rows without email or mobile number are flagged, never fabricated
- **CSV export** — download mapped results
- **Dark mode** — toggle in the header
- **Responsive** — works on mobile and desktop
- **Color-coded status badges** — `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express 5, TypeScript |
| AI | Groq (Llama 3.3 70B Versatile) — free tier |
| CSV Parsing | PapaParse (frontend), csv-parse (backend-ready) |
| Database | None (stateless, in-memory processing per request) |

---

## Architecture

```
┌─────────────┐         POST /api/import          ┌──────────────┐
│  Vercel     │  ──────── { rows: [...] } ──────→  │   Render     │
│  (Next.js)  │  ←────── { imported, skipped } ──  │  (Express)   │
└─────────────┘                                    └──────┬───────┘
       │                                                    │
       │ 40 KB CSVs                                         │ 1. Split into batches of 25
       │ parsed client-side                                 │ 2. Send each batch to Groq AI
       │ via PapaParse                                      │ 3. Parse & validate JSON response
       │                                                    │ 4. Retry on failure (2x, backoff)
                                                           │ 5. Return structured result
```

### Monorepo Structure

```
groweasy/
├── frontend/                    # Next.js app (Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Main 4-step flow (Upload → Preview → Confirm → Result)
│   │   │   ├── layout.tsx       # Root layout with Inter font
│   │   │   └── globals.css      # GrowEasy brand tokens
│   │   ├── components/
│   │   │   ├── DropZone.tsx     # Drag & drop file upload
│   │   │   ├── PreviewTable.tsx # Raw CSV preview with sticky headers
│   │   │   ├── ResultsView.tsx  # Mapped records + skipped rows + CSV export
│   │   │   ├── StepIndicator.tsx# 4-step progress bar
│   │   │   └── ThemeProvider.tsx# Dark mode context
│   │   └── lib/
│   │       └── types.ts         # Shared TypeScript interfaces
│   └── public/assets/
│       └── logo.svg             # GrowEasy brand logo
├── server/                      # Express API (Render)
│   └── src/
│       ├── index.ts             # POST /api/import — batching, concurrency, retries
│       ├── gemini.ts            # Groq AI client (OpenAI-compatible SDK)
│       ├── prompt.ts            # AI prompt with 4 few-shot examples + response validator
│       └── types.ts             # Shared types
├── samples/                     # Test CSV files
│   ├── facebook-leads-export.csv
│   ├── google-ads-export.csv
│   └── messy-manual-sheet.csv
├── .env.example
├── .gitignore
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- A free Groq API key from [Groq Console](https://console.groq.com) (sign up, create key — free tier)

### 1. Clone

```bash
git clone https://github.com/rupamghosh2006/groweasy-csv-importer.git
cd groweasy-csv-importer
```

### 2. Server (Express)

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```env
GROQ_API_KEY=gsk_your_actual_groq_key
PORT=3001
BATCH_SIZE=25
CONCURRENCY=2
MAX_RETRIES=2
```

Install & run:

```bash
npm install
npm run dev
```

Server starts at **http://localhost:3001**.

### 3. Frontend (Next.js)

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Install & run:

```bash
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**.

---

## API Reference

### POST /api/import

Accepts parsed CSV rows as JSON.

**Request:**
```json
{
  "rows": [
    { "Full Name": "John Doe", "Email": "john@example.com", ... },
    { ... }
  ]
}
```

**Success Response (200):**
```json
{
  "imported": [
    {
      "created_at": "",
      "name": "John Doe",
      "email": "john@example.com",
      "country_code": "+1",
      "mobile_without_country_code": "5551234567",
      "company": "Acme Corp",
      "city": "New York",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "GOOD_LEAD_FOLLOW_UP",
      "crm_note": "Source: Facebook Ad",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [
    {
      "original_row": { "Comment": "Just browsing" },
      "reason": "no email or mobile number found"
    }
  ],
  "totalImported": 1,
  "totalSkipped": 1,
  "totalRows": 2
}
```

**Error Responses:**
| Status | Meaning |
|---|---|
| 400 | Invalid body, empty rows, or exceeds 5000 rows |
| 500 | Internal error or AI failure (details in `error` field) |

---

## CRM Schema

| Field | Type | Description | Rules |
|---|---|---|---|
| `created_at` | string | Lead creation date | Must be parseable by `new Date()`. Format: YYYY-MM-DD HH:mm:ss |
| `name` | string | Lead name | Extracted from any name-like column |
| `email` | string | Primary email | First email found; rest go in `crm_note` |
| `country_code` | string | Country code (e.g. +91) | Extracted from phone fields |
| `mobile_without_country_code` | string | Mobile number | First number found; rest go in `crm_note` |
| `company` | string | Company name | — |
| `city` | string | City | — |
| `state` | string | State | — |
| `country` | string | Country | — |
| `lead_owner` | string | Lead owner | — |
| `crm_status` | enum | Lead status | `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` |
| `crm_note` | string | Catch-all | Remarks, extra emails/phones, unmapped data |
| `data_source` | enum | Source | `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` |
| `possession_time` | string | Property possession time | — |
| `description` | string | Additional description | — |

---

## AI Prompt Engineering

The AI prompt includes:

1. **System instructions** — full schema definition with all 15 fields
2. **8 precise extraction rules**:
   - `crm_status` limited to 4 enum values
   - `data_source` limited to 5 enum values (matched by project context)
   - `created_at` normalization to `YYYY-MM-DD HH:mm:ss`
   - `crm_note` as catch-all for extra info
   - Multiple emails/mobiles → first in field, rest in `crm_note`
   - CSV safety — newlines escaped as `\n`
   - **Skip rule** — rows without email AND mobile are rejected
   - No hallucinated values
3. **4 few-shot examples** showing:
   - Standard Facebook Lead Ad mapping
   - Multiple emails/phones with messy headers
   - Skipped row (no contact info)
   - Real estate CSV with property context (`sarjapur_plots`)
4. **Output format** enforce — strict JSON only, no markdown fences

Response post-processing strips markdown fences, extracts JSON, and validates every mapped field against the allowed enums before accepting.

---

## Backend Processing Pipeline

```
Raw rows → Split into batches (25 each) → Process 3 batches concurrently
  → For each batch:
      1. Build prompt with schema + few-shot examples + batch rows
      2. Send to Groq (Llama 3.3 70B)
      3. Parse & validate JSON response
      4. If malformed → retry (up to 2x with 2s/4s backoff)
      5. If all retries fail → add to skipped with error reason
  → Aggregate all imported + skipped records
  → Return final response
```

---

## Testing

Sample CSVs are in the `samples/` folder for quick end-to-end testing:

```bash
# Facebook Lead Ads style
samples/facebook-leads-export.csv

# Google Ads style
samples/google-ads-export.csv

# Mixed columns, multiple emails/phones, row with no contact info
samples/messy-manual-sheet.csv
```

**Edge cases handled:**
- ✅ Empty CSV files
- ✅ Non-CSV files rejected
- ✅ Rows missing both email and mobile → skipped with reason
- ✅ Multiple emails in one cell → first mapped, rest in notes
- ✅ Multiple phones in one cell → first mapped, rest in notes
- ✅ Ambiguous column headers (e.g. "Contact" = phone number)
- ✅ Gemini/Groq API rate limits (429) → retries with backoff
- ✅ Malformed AI JSON → retry mechanism
- ✅ Maximum 5000 rows per request

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub
2. On Vercel, click **Add New → Project**
3. Import `rupamghosh2006/groweasy-csv-importer`
4. Configure:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
5. Deploy
6. In **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_API_URL` = `https://groweasy-csv-importer-yi3v.onrender.com`

### Backend → Render

1. On Render, click **New + → Web Service**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `groweasy-csv-importer-server`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx tsc`
   - **Start Command:** `node dist/index.js`
4. Add environment variables:
   - `GROQ_API_KEY` = your Groq API key
   - `NODE_VERSION` = 18

---

## User Flow

```
Step 1: Upload CSV
  ┌─────────────────────────────┐
  │  Drag & drop or browse .csv │
  │  File validated client-side │
  └─────────────┬───────────────┘
                ↓
Step 2: Preview
  ┌─────────────────────────────┐
  │  Raw CSV shown in table     │
  │  Sticky headers, scrollable │
  │  Row count displayed        │
  │  NO AI call yet             │
  └─────────────┬───────────────┘
                ↓
Step 3: Confirm
  ┌─────────────────────────────┐
  │  "Confirm & Import" button  │
  │  Progress: "Batch 2 of 5..."│
  │  Sends rows to backend API  │
  └─────────────┬───────────────┘
                ↓
Step 4: Result
  ┌─────────────────────────────┐
  │  Summary: Imported / Skipped│
  │  Mapped CRM records table   │
  │  Color-coded status badges  │
  │  Collapsible skipped list   │
  │  Download as CSV button     │
  └─────────────────────────────┘
```

---

## Bonus Features Implemented

- [x] Drag & drop upload — dashed dropzone with highlight on drag
- [x] Progress indicator during AI processing — "Processing batch X of Y"
- [x] Retry mechanism for failed AI batches — 2 retries with exponential backoff
- [x] Dark mode toggle — stored in localStorage, persists across sessions
- [x] Virtualized scrolling — max-height tables with overflow scroll for large CSVs
- [x] Responsive design — mobile-first with stacked layouts
- [x] CSV export — download mapped results as clean CSV
- [x] Loading skeletons — spinner during parsing and import
- [x] Error boundaries — friendly error messages, never raw stack traces
- [x] Environment-based config — `.env` for API keys, batch size, concurrency

---

## Known Limitations

- Maximum **5000 rows** per import (configurable in env)
- Preview shows only **first 100 rows** (full data sent to AI)
- No database — results returned as JSON only; download CSV to persist
- Groq free tier has rate limits (30 req/min for Llama 3.3 70B); reduce `CONCURRENCY` to 1 if hitting limits
- AI may occasionally return malformed JSON; retry mechanism handles most cases

---

## Submission

| Field | Value |
|---|---|
| **Position Applied** | Software Developer Intern |
| **Hosted App URL** | https://groweasy-csv-importer-six-beta.vercel.app |
| **Backend API** | https://groweasy-csv-importer-yi3v.onrender.com |
| **GitHub Repo** | https://github.com/rupamghosh2006/groweasy-csv-importer |
| **Email to** | varun@groweasy.ai |

### Submission Checklist
- [x] Publicly hosted frontend (Vercel)
- [x] Publicly hosted backend (Render)
- [x] Public GitHub repository
- [x] README with setup instructions
- [x] `.env.example` for both frontend + server
- [x] Sample CSVs included
- [x] AI field mapping with Groq (free tier)
- [x] Drag & drop upload
- [x] Progress indicators
- [x] Retry mechanism
- [x] Dark mode
- [x] Responsive design
