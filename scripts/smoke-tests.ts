// Lightweight smoke tests for main features without running Next server
// Loads environment, imports API route handlers, and invokes them with mock requests.

import path from 'path';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Utility: create a mock NextRequest-like object that only implements json()
function mockJsonRequest(body: any) {
  return {
    json: async () => body,
  } as any;
}

// Utility: read JSON body from a Response/NextResponse
async function readJson(res: Response) {
  try {
    const data = await (res as any).json();
    return data;
  } catch {
    const text = await res.text();
    return { raw: text };
  }
}

async function testAnalyzeWebsite() {
  const mod = await import(pathToFileURL(path.join(process.cwd(), 'app', 'api', 'analyze-website', 'route.ts')).href);
  const { POST } = mod as { POST: (req: any) => Promise<Response> };

  const req = mockJsonRequest({ url: 'https://example.com' });
  const res = await POST(req);
  const status = (res as any).status;
  const json = await readJson(res);

  return { name: 'analyze-website', status, ok: status >= 200 && status < 400, sample: Object.keys(json) };
}

async function testDriveSync() {
  const syncMod = await import(pathToFileURL(path.join(process.cwd(), 'app', 'api', 'drive', 'sync', 'route.ts')).href);
  const statusMod = await import(pathToFileURL(path.join(process.cwd(), 'app', 'api', 'drive', 'status', '[jobId]', 'route.ts')).href);
  const { POST: SYNC_POST } = syncMod as { POST: (req: any) => Promise<Response> };
  const { GET: STATUS_GET } = statusMod as { GET: (req: any, ctx: any) => Promise<Response> };

  // Use maxDocuments=0 to validate flow quickly (no download/upload)
  const req = mockJsonRequest({ maxDocuments: 0 });
  const res = await SYNC_POST(req);
  const data = await readJson(res);
  const jobId = (data as any).jobId;

  // Poll status for up to ~20s
  let status = 'unknown';
  let message = '';
  for (let i = 0; i < 20; i++) {
    const sres = await STATUS_GET({}, { params: { jobId } });
    const sj = await readJson(sres);
    status = sj.job?.status || 'unknown';
    message = sj.message || '';
    if (status === 'completed' || status === 'failed') break;
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { name: 'drive-sync', ok: status === 'completed' || status === 'failed', status, message, jobId };
}

async function testLeadsSearch() {
  const mod = await import(pathToFileURL(path.join(process.cwd(), 'app', 'api', 'leads', 'search', 'route.ts')).href);
  const { POST } = mod as { POST: (req: any) => Promise<Response> };

  const req = mockJsonRequest({ query: 'Find AI company leads', maxLeads: 5, minConfidence: 0.5 });
  const res = await POST(req);
  const status = (res as any).status;
  const json = await readJson(res);

  // ok if successful or if it correctly reports missing documents
  const ok = status === 200 || (status === 400 && /No documents/i.test(JSON.stringify(json)));
  const leadsCount = Array.isArray((json as any).leads) ? (json as any).leads.length : 0;
  return { name: 'leads-search', status, ok, leadsCount, note: status === 400 ? 'No documents available' : undefined };
}

async function testLeadsExport() {
  const mod = await import(pathToFileURL(path.join(process.cwd(), 'app', 'api', 'leads', 'export', 'route.ts')).href);
  const { POST } = mod as { POST: (req: any) => Promise<Response> };

  const sampleLeads = [
    {
      company: {
        name: 'Example Corp',
        industry: 'AI',
        website: 'https://example.com',
        location: 'Remote',
        description: 'Sample company',
        size: '11-50',
      },
      contacts: [
        {
          name: 'Jane Doe',
          title: 'CTO',
          email: 'jane@example.com',
          phone: '+1-555-0100',
          linkedin: 'https://linkedin.com/in/janedoe',
        },
      ],
      source: 'test.json',
      confidence: 0.9,
      extractedAt: new Date().toISOString(),
    },
  ];

  const req = mockJsonRequest({ leads: sampleLeads, format: 'csv' });
  const res = await POST(req);
  const status = (res as any).status;
  const text = await res.text();
  const looksCsv = /company_name,company_industry,company_size/.test(text);
  return { name: 'leads-export', status, ok: status === 200 && looksCsv };
}

async function testChatMinimal() {
  const mod = await import(pathToFileURL(path.join(process.cwd(), 'app', 'api', 'chat', 'route.ts')).href);
  const { POST } = mod as { POST: (req: any) => Promise<Response> };

  const messages = [
    { id: '1', role: 'user', content: 'Hello! Just a quick test.' },
  ];
  const req = mockJsonRequest({ messages, selectedModelId: 'gemini-2.5-flash', isReasoningEnabled: false });

  try {
    const res = await POST(req);
    // We won’t consume the stream fully; just check headers/status
    const status = (res as any).status;
    return { name: 'chat', status, ok: status >= 200 && status < 500 };
  } catch (err: any) {
    return { name: 'chat', ok: false, error: err?.message || String(err) };
  }
}

async function main() {
  // Load .env.local explicitly
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  } else {
    dotenv.config();
  }
  const results: any[] = [];
  const start = Date.now();

  // Create minimal .env loading confirmation (don’t print secrets)
  const requiredEnv = [
    'ANTHROPIC_API_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
    'GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL',
    'GOOGLE_DRIVE_PRIVATE_KEY',
    'GOOGLE_DRIVE_FOLDER_ID',
    'GEMINI_FILE_SEARCH_STORE_ID',
  ];
  const envStatus = requiredEnv.map((k) => ({ key: k, set: !!process.env[k] }));
  results.push({ name: 'env-check', ok: envStatus.every((e) => e.set), details: envStatus });

  try { results.push(await testAnalyzeWebsite()); } catch (e: any) { results.push({ name: 'analyze-website', ok: false, error: e?.message }); }
  try { results.push(await testDriveSync()); } catch (e: any) { results.push({ name: 'drive-sync', ok: false, error: e?.message }); }
  try { results.push(await testLeadsSearch()); } catch (e: any) { results.push({ name: 'leads-search', ok: false, error: e?.message }); }
  try { results.push(await testLeadsExport()); } catch (e: any) { results.push({ name: 'leads-export', ok: false, error: e?.message }); }
  try { results.push(await testChatMinimal()); } catch (e: any) { results.push({ name: 'chat', ok: false, error: e?.message }); }

  const durationMs = Date.now() - start;
  const summary = {
    durationMs,
    passed: results.filter((r) => r.ok).map((r) => r.name),
    failed: results.filter((r) => !r.ok).map((r) => r.name),
  };

  // Write a brief report to stdout
  console.log(JSON.stringify({ summary, results }, null, 2));
}

main().catch((err) => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
