import type { CrmRecord, CrmStatus, DataSource } from './types';

function buildSystemInstructions(): string {
  return `You are a CRM data mapping assistant. Your task is to map CSV rows into a fixed CRM schema.

TARGET SCHEMA (each field must be a string):
- created_at: Lead creation date, normalized to YYYY-MM-DD HH:mm:ss format (must be parseable by JS new Date())
- name: Lead name
- email: Primary email (first email if multiple)
- country_code: Country code (e.g., +91)
- mobile_without_country_code: Mobile number without country code
- company: Company name
- city: City
- state: State
- country: Country
- lead_owner: Lead owner
- crm_status: One of: GOOD_LEAD_FOLLOW_UP, DID_NOT_CONNECT, BAD_LEAD, SALE_DONE (only these 4; leave blank if unclear)
- crm_note: Catch-all for remarks, extra notes, additional emails/phones, unmapped data
- data_source: One of: leads_on_demand, meridian_tower, eden_park, varah_swamy, sarjapur_plots (leave blank if no confident match)
- possession_time: Property possession time
- description: Additional description

RULES:
1. crm_status: ONLY use the 4 values above. Never invent new ones.
2. data_source: ONLY use the 5 values above. Match by project name context or leave blank.
3. created_at: Normalize to YYYY-MM-DD HH:mm:ss. Leave blank if no date exists. NEVER fabricate.
4. crm_note: Put ALL extra info here: follow-up notes, extra comments, additional phone numbers, additional email addresses, unmapped columns.
5. Multiple emails: First email goes to 'email' field; rest go in crm_note. Same for mobile numbers.
6. Every record must stay a single logical row. Escape newlines inside text fields as \\n for CSV safety.
7. SKIP RULE: If a row has NEITHER an email NOR a mobile number, put it in the "skipped" array with a clear reason in the "reason" field. DO NOT include it in the "imported" array.
8. Never hallucinate values. Leave fields blank/null if no evidence exists in the row.
9. CRITICAL: Return ONLY valid JSON. No markdown fences, no prose, no code blocks.

OUTPUT FORMAT:
{
  "imported": [
    {
      "created_at": "",
      "name": "",
      "email": "",
      "country_code": "",
      "mobile_without_country_code": "",
      "company": "",
      "city": "",
      "state": "",
      "country": "",
      "lead_owner": "",
      "crm_status": "",
      "crm_note": "",
      "data_source": "",
      "possession_time": "",
      "description": ""
    }
  ],
  "skipped": [
    {
      "original_row": {},
      "reason": "no email or mobile number found"
    }
  ]
}`;
}

function buildFewShotExamples(): string {
  return `
EXAMPLE 1 - Standard columns with clear mapping:
Input row: {"Full Name":"John Doe","Email Address":"john@example.com","Phone":"+1-555-123-4567","Company":"Acme Corp","City":"New York","Source":"Facebook Ad"}
Expected output:
{
  "imported": [{
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
  }],
  "skipped": []
}

EXAMPLE 2 - Multiple emails and phones, messy headers:
Input row: {"Contact":"Jane","Email":"jane@work.com, jane@personal.com","Mobile":"9876543210, 8765432109","Project":"Meridian Tower","Status":"Interested","Notes":"Call after 6pm","Date":"15/03/2025"}
Expected output:
{
  "imported": [{
    "created_at": "2025-03-15 00:00:00",
    "name": "Jane",
    "email": "jane@work.com",
    "country_code": "",
    "mobile_without_country_code": "9876543210",
    "company": "",
    "city": "",
    "state": "",
    "country": "",
    "lead_owner": "",
    "crm_status": "DID_NOT_CONNECT",
    "crm_note": "Additional emails: jane@personal.com | Additional mobiles: 8765432109 | Notes: Call after 6pm",
    "data_source": "meridian_tower",
    "possession_time": "",
    "description": ""
  }],
  "skipped": []
}

EXAMPLE 3 - Row that should be skipped:
Input row: {"Comment":"Just browsing","Source":"Website"}
Expected output:
{
  "imported": [],
  "skipped": [{
    "original_row": {"Comment":"Just browsing","Source":"Website"},
    "reason": "no email or mobile number found"
  }]
}

EXAMPLE 4 - Real estate CSV with varied columns:
Input row: {"Buyer Name":"Alice Smith","Buyer Email":"alice@test.com","Contact No":"+91-9876543210","Property":"Sarjapur Plots","Stage":"Hot Lead","Remark":"Wants 2BHK, ready to move","Possession":"Dec 2025"}
Expected output:
{
  "imported": [{
    "created_at": "",
    "name": "Alice Smith",
    "email": "alice@test.com",
    "country_code": "+91",
    "mobile_without_country_code": "9876543210",
    "company": "",
    "city": "",
    "state": "",
    "country": "",
    "lead_owner": "",
    "crm_status": "GOOD_LEAD_FOLLOW_UP",
    "crm_note": "Property: Sarjapur Plots | Remark: Wants 2BHK, ready to move",
    "data_source": "sarjapur_plots",
    "possession_time": "Dec 2025",
    "description": ""
  }],
  "skipped": []
}`;
}

export function buildImportPrompt(rows: Record<string, string>[]): string {
  const instructions = buildSystemInstructions();
  const examples = buildFewShotExamples();
  const rowsJson = JSON.stringify(rows, null, 2);

  return `${instructions}
${examples}

Now process the following CSV rows (each row is an object with column headers as keys). Think about what each column contains, not just its header name. For example, a column full of 10-digit numbers is likely a phone number even if the header just says "Contact".

ROWS TO PROCESS:
${rowsJson}

Return a JSON object with "imported" and "skipped" arrays following the schema above. ONLY valid JSON.`;
}

export function cleanAndParseResponse(text: string): { imported: CrmRecord[]; skipped: { original_row: Record<string, string>; reason: string }[] } {
  let cleaned = text.trim();

  const jsonMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  const braceStart = cleaned.indexOf('{');
  const braceEnd = cleaned.lastIndexOf('}');
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    cleaned = cleaned.slice(braceStart, braceEnd + 1);
  }

  const parsed = JSON.parse(cleaned);

  if (!parsed.imported || !Array.isArray(parsed.imported)) {
    throw new Error('Response missing "imported" array');
  }
  if (!parsed.skipped || !Array.isArray(parsed.skipped)) {
    throw new Error('Response missing "skipped" array');
  }

  const validStatuses: CrmStatus[] = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE', ''];
  const validSources: DataSource[] = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots', ''];

  const validatedImported: CrmRecord[] = parsed.imported.map((record: Record<string, unknown>) => {
    const status = String(record.crm_status || '');
    const source = String(record.data_source || '');
    return {
      created_at: String(record.created_at || ''),
      name: String(record.name || ''),
      email: String(record.email || ''),
      country_code: String(record.country_code || ''),
      mobile_without_country_code: String(record.mobile_without_country_code || ''),
      company: String(record.company || ''),
      city: String(record.city || ''),
      state: String(record.state || ''),
      country: String(record.country || ''),
      lead_owner: String(record.lead_owner || ''),
      crm_status: validStatuses.includes(status as CrmStatus) ? (status as CrmStatus) : '',
      crm_note: String(record.crm_note || ''),
      data_source: validSources.includes(source as DataSource) ? (source as DataSource) : '',
      possession_time: String(record.possession_time || ''),
      description: String(record.description || ''),
    };
  });

  return {
    imported: validatedImported,
    skipped: parsed.skipped,
  };
}
