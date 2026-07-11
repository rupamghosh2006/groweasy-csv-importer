# GrowEasy — AI-Powered CRM CSV Importer

Upload any CSV (Facebook Leads, Google Ads, real-estate CRMs, manual spreadsheets) and get its columns intelligently mapped into a fixed CRM schema using Google Gemini AI.

**Live App:** https://groweasy-csv-importer.vercel.app  
**Backend API:** https://groweasy-csv-importer.onrender.com  

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Backend | Node.js + Express, TypeScript |
| AI | Google Gemini 2.0 Flash API |
| CSV Parsing | PapaParse (frontend) |
| Database | None (stateless, in-memory processing) |

## Monorepo Structure

```
groweasy/
├── frontend/          # Next.js app — deploy to Vercel
│   ├── src/app/       # Pages (single-page flow)
│   ├── src/components/# UI components
│   └── src/lib/       # Shared types
├── server/            # Express API — deploy to Render
│   └── src/
│       ├── index.ts   # Express server + API route
│       ├── gemini.ts  # Gemini client
│       ├── prompt.ts  # AI prompt builder + response parser
│       └── types.ts   # Shared types
├── samples/           # Test CSV files
└── README.md
```

---

## Setup

### Prerequisites

- Node.js 18+
- A Gemini API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone

```bash
git clone https://github.com/rupamghosh2006/groweasy-csv-importer.git
cd groweasy-csv-importer
```

### 2. Server Setup

```bash
cd server
cp .env.example .env
```

Edit `server/.env` and set your Gemini key:

```
GEMINI_API_KEY=your_actual_gemini_api_key
```

Install and run:

```bash
npm install
npm run dev
```

Server starts at **http://localhost:3001**.

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env.local
```

Edit `frontend/.env.local` and point to your server:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Install and run:

```bash
npm install
npm run dev
```

Frontend starts at **http://localhost:3000**.

---

## API

### POST /api/import

**Request:** `{ "rows": [ { "col1": "val1", ... }, ... ] }`

**Response:**
```json
{
  "imported": [{ ...CRM record... }],
  "skipped": [{ "original_row": {...}, "reason": "..." }],
  "totalImported": 0,
  "totalSkipped": 0,
  "totalRows": 0
}
```

The backend:
- Splits rows into batches (default 25)
- Sends each batch to Gemini with an engineered prompt
- Runs 3 batches in parallel
- Retries failed batches up to 2 times with exponential backoff
- Validates and sanitizes Gemini's JSON output

---

## CRM Schema

| Field | Description | Allowed Values |
|---|---|---|
| `created_at` | Lead creation date | YYYY-MM-DD HH:mm:ss |
| `name` | Lead name | any string |
| `email` | Primary email | any string |
| `country_code` | Country code (e.g. +91) | any string |
| `mobile_without_country_code` | Mobile number | any string |
| `company` | Company name | any string |
| `city` | City | any string |
| `state` | State | any string |
| `country` | Country | any string |
| `lead_owner` | Lead owner | any string |
| `crm_status` | Lead status | `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE` |
| `crm_note` | Catch-all for extra info | any string |
| `data_source` | Source | `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots` |
| `possession_time` | Property possession time | any string |
| `description` | Additional description | any string |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
npx vercel --prod
```

Set environment variable in Vercel dashboard:
- `NEXT_PUBLIC_API_URL` = your Render backend URL (e.g. `https://groweasy-server.onrender.com`)

### Backend → Render

1. Push the repo to GitHub
2. On Render, create a **New Web Service**
3. Connect your repo
4. Set:
   - **Root Directory:** `server`
   - **Build Command:** `npm install && npx tsc`
   - **Start Command:** `node dist/index.js`
5. Add environment variable:
   - `GEMINI_API_KEY` = your Gemini API key
   - `PORT` = 10000 (Render automatically sets this)
   - `NODE_VERSION` = 18

---

## Testing

Sample CSVs are in the `samples/` folder:

- **`facebook-leads-export.csv`** — Facebook Lead Ads style
- **`google-ads-export.csv`** — Google Ads style
- **`messy-manual-sheet.csv`** — Mixed columns, multiple emails/phones, rows with no contact info (should be skipped)

---

## Known Limitations

- Maximum 5000 rows per import
- First 100 rows shown in preview (full data sent to AI)
- No database — results returned as JSON only (download CSV to save results)
- Gemini may occasionally return malformed JSON; retry mechanism handles most cases

---

## Submission

- **Position Applied:** (Intern / Full-Time — fill in)
- **Hosted App URL:** https://groweasy-csv-importer.vercel.app
- **GitHub Repo:** https://github.com/rupamghosh2006/groweasy-csv-importer
- **Email to:** varun@groweasy.ai
