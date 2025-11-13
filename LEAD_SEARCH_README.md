# Lead Search AI Agent - Google Drive + Gemini File Search

An end-to-end AI Agent service for extracting leads from Google Drive documents using Gemini 2.5 Pro File Search API. Built with Next.js 15, Vercel AI SDK, and integrated into an intuitive chat interface.

## 🎯 Overview

This application allows you to:
- **Sync documents** from a Google Drive folder automatically
- **Extract structured lead data** (company info, contacts, emails, phones) using AI
- **Chat interface** for natural language queries ("extract leads", "find technology companies", etc.)
- **Export results** to CSV with all extracted information
- **Track accuracy** with confidence scores (target: 80%+ accuracy)

## 🏗️ Architecture

```
┌─────────────────┐
│  Google Drive   │
│    Folder       │
└────────┬────────┘
         │ OAuth/Service Account
         ├─────────────────────────────────┐
         │                                 │
         ▼                                 ▼
┌─────────────────┐            ┌─────────────────────┐
│   Drive API     │──Upload───▶│ Gemini File Search  │
│  (Download)     │            │    (RAG Store)      │
└─────────────────┘            └──────────┬──────────┘
                                          │
                                          │ Query
                                          ▼
                              ┌──────────────────────────┐
                              │   Gemini 2.5 Pro API     │
                              │  (Lead Extraction +      │
                              │   Structured Output)     │
                              └────────────┬─────────────┘
                                          │
                                          ▼
                              ┌──────────────────────────┐
                              │  Next.js Chat Interface  │
                              │  - Lead Cards            │
                              │  - CSV Export            │
                              │  - Confidence Scores     │
                              └──────────────────────────┘
```

## ✨ Features

### Core Functionality
- ✅ **Google Drive Integration**: Service account authentication for single folder access
- ✅ **Gemini File Search**: Fully managed RAG with automatic document indexing
- ✅ **Gemini 2.5 Pro**: Latest model with thinking capabilities for accurate extraction
- ✅ **Structured Extraction**: Zod schemas with validation for lead data
- ✅ **Real-time Chat**: Integrated into existing Next.js chatbot UI
- ✅ **CSV Export**: Download extracted leads with all fields
- ✅ **Confidence Scoring**: 0-1 scale with accuracy metrics
- ✅ **Context7 MCP**: Up-to-date API documentation integration

### Supported Document Types
- PDF, DOCX, DOC
- TXT, CSV
- XLSX, XLS

### Extracted Data
**Company Information:**
- Name, Industry, Size
- Website, Location
- Description

**Contact Information:**
- Name, Title
- Email, Phone
- LinkedIn profile

## 📋 Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher
- **Google Cloud Project** with:
  - Drive API enabled
  - Service Account created
  - Gemini API access
- **Google Drive**: Folder with documents to process

## 🚀 Setup Guide

### Step 1: Clone and Install

```bash
cd ai-sdk-reasoning-starter
npm install
```

### Step 2: Google Cloud Setup

#### A. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google Drive API**
4. Enable **Generative AI API** (for Gemini)

#### B. Create Service Account
1. Navigate to **IAM & Admin** → **Service Accounts**
2. Click **Create Service Account**
3. Name it (e.g., "lead-search-service")
4. Click **Create and Continue**
5. Grant **Viewer** role (or specific Drive permissions)
6. Click **Done**

#### C. Generate Service Account Key
1. Click on the created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create New Key**
4. Choose **JSON**
5. Download the key file

#### D. Share Google Drive Folder
1. Open your Google Drive folder: `https://drive.google.com/drive/u/0/folders/16xlnwXtgCgKDmkUPLC4UL_iGM-UkB5pR`
2. Click **Share**
3. Add the service account email (found in the JSON key file)
4. Give **Viewer** or **Editor** permissions
5. Click **Share**

#### E. Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/apikey)
2. Click **Get API Key**
3. Create or select a project
4. Copy the API key

### Step 3: Environment Configuration

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Anthropic API (for Claude - optional, only if using Claude models)
ANTHROPIC_API_KEY=your_anthropic_key_here

# Gemini API (Required)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Google Drive Service Account (Required)
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Target Google Drive Folder (Already configured)
GOOGLE_DRIVE_FOLDER_ID=16xlnwXtgCgKDmkUPLC4UL_iGM-UkB5pR

# Gemini File Search Store ID (Auto-generated on first sync)
GEMINI_FILE_SEARCH_STORE_ID=
```

**Important Notes:**
- Extract `client_email` and `private_key` from your service account JSON file
- Keep the `\n` characters in the private key
- The `GEMINI_FILE_SEARCH_STORE_ID` will be populated automatically after first sync

### Step 4: Initial Document Sync

Run the initial sync to upload documents from Google Drive to Gemini:

```bash
npm run sync:drive
```

This script will:
1. ✅ Connect to Google Drive
2. ✅ Scan the specified folder
3. ✅ Download supported documents
4. ✅ Upload to Gemini File Search
5. ✅ Wait for indexing to complete
6. ✅ Save store ID to `.env.local`

**Expected output:**
```
🚀 Starting initial Google Drive sync...
✅ Found 87 supported documents
⬇️  Downloading documents from Google Drive...
✅ Downloaded 87 documents
⬆️  Uploading documents to Gemini File Search...
✅ Uploaded 87 documents
⏳ Waiting for documents to be processed...
✅ All documents processed
🎉 Sync completed successfully!
```

### Step 5: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 💬 Usage

### 1. Using the Chat Interface

Once the app is running, you can interact with it through natural language:

**Example Queries:**
```
"Extract leads from the documents"
"Find all companies in technology sector"
"Show me contacts with email addresses"
"Find leads from companies with 50+ employees"
"Export all leads to CSV"
```

### 2. Sync Google Drive Button

Click the **"Sync Google Drive"** button on the welcome screen to:
- Scan for new or modified documents
- Upload them to Gemini File Search
- Update the index

### 3. Viewing Lead Results

Leads are displayed as expandable cards showing:
- **Company details**: Name, industry, size, website, location
- **Contact information**: Name, title, email, phone, LinkedIn
- **Source document**: Original file name
- **Confidence score**: Color-coded (green: 80%+, yellow: 60-80%, red: <60%)

### 4. Exporting Data

Click **"Export to CSV"** to download all extracted leads with:
- All company fields
- All contact fields (one row per contact)
- Source documents
- Confidence scores
- Extraction timestamps

## 🔧 API Endpoints

### Drive Sync
```http
POST /api/drive/sync
Content-Type: application/json

{
  "maxDocuments": 100  // optional
}
```

### Check Sync Status
```http
GET /api/drive/status/{jobId}
```

### Search Leads
```http
POST /api/leads/search
Content-Type: application/json

{
  "query": "technology companies",
  "maxLeads": 50,
  "minConfidence": 0.6
}
```

### Export Leads
```http
POST /api/leads/export
Content-Type: application/json

{
  "leads": [...],
  "format": "csv"  // or "json"
}
```

## 📊 Accuracy & Performance

### Target Metrics
- **Extraction Accuracy**: 80%+ (with confidence scoring)
- **Document Processing**: 50-100 documents supported
- **Response Time**: 10-30 seconds for full lead extraction

### Confidence Scoring
The system calculates confidence based on:
- **Completeness** (30%): How much information was extracted
- **AI Confidence** (70%): Gemini's certainty in the extraction

**Score Breakdown:**
- **0.8-1.0** (Green): High confidence, complete data
- **0.6-0.8** (Yellow): Medium confidence, some missing fields
- **0.0-0.6** (Red): Low confidence, incomplete or uncertain data

## 🔄 Incremental Sync

To sync only new or modified documents:

```bash
npm run sync:incremental
```

This maintains a cache (`.sync-cache.json`) of previously synced files and only uploads changes.

## 🛠️ Advanced Configuration

### Model Selection

The app automatically selects **Gemini 2.5 Pro** for lead extraction queries. You can also manually select models from the dropdown:
- Claude Sonnet 3.7
- DeepSeek-R1
- DeepSeek-R1 Llama 70B
- Gemini 2.5 Pro
- Gemini 2.5 Flash

### Context7 MCP

Context7 provides up-to-date API documentation. Configuration is in [`.mcp/context7.json`](.mcp/context7.json).

To use in your prompts:
```
"use context7 to explain the latest Gemini File Search API"
```

### Custom Document Filters

Edit [`lib/google-drive.ts`](lib/google-drive.ts#L23-L35) to add/remove supported file types:

```typescript
const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Add more...
];
```

### Lead Extraction Prompts

Customize extraction logic in [`lib/lead-extractor.ts`](lib/lead-extractor.ts#L6-L57):

```typescript
export const LEAD_EXTRACTION_PROMPT = `
Your custom prompt here...
`;
```

## 📁 Project Structure

```
ai-sdk-reasoning-starter/
├── app/
│   ├── api/
│   │   ├── chat/route.ts          # Enhanced chat with lead detection
│   │   ├── drive/
│   │   │   ├── sync/route.ts      # Drive sync endpoint
│   │   │   └── status/[jobId]/route.ts
│   │   └── leads/
│   │       ├── search/route.ts    # Lead search endpoint
│   │       └── export/route.ts    # CSV export endpoint
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── chat.tsx                   # Enhanced with sync button
│   ├── lead-results.tsx           # Lead display cards
│   ├── export-button.tsx          # CSV export button
│   ├── messages.tsx
│   └── input.tsx
├── lib/
│   ├── models.ts                  # Added Gemini 2.5 Pro
│   ├── google-drive.ts            # Drive API client
│   ├── gemini-file-search.ts      # File Search client
│   ├── lead-extractor.ts          # Extraction logic
│   └── schemas/
│       └── lead.ts                # Zod schemas
├── scripts/
│   ├── init-drive-sync.ts         # Initial sync script
│   └── incremental-sync.ts        # Incremental sync script
├── .mcp/
│   └── context7.json              # MCP configuration
├── .env.example                   # Template
├── .env.local                     # Your credentials (gitignored)
└── package.json
```

## 🐛 Troubleshooting

### Google Drive Access Denied
**Problem**: "Cannot access Google Drive folder"

**Solution:**
1. Verify service account email in `.env.local` matches JSON key file
2. Check that folder is shared with service account
3. Ensure service account has at least "Viewer" permissions
4. Verify folder ID is correct

### Gemini API Errors
**Problem**: "Failed to upload documents to Gemini"

**Solution:**
1. Check API key is valid at [AI Studio](https://aistudio.google.com/apikey)
2. Ensure Generative AI API is enabled in Google Cloud Console
3. Check API quotas and rate limits
4. Verify file sizes are within limits (max ~10MB per file)

### No Leads Extracted
**Problem**: Chat returns empty results

**Solution:**
1. Run `npm run sync:drive` to ensure documents are uploaded
2. Check documents contain actual lead information (company names, contacts)
3. Try more specific queries (e.g., "find companies with email addresses")
4. Lower `minConfidence` parameter in search API

### Sync Takes Too Long
**Problem**: Initial sync timeout or hangs

**Solution:**
1. Reduce `maxDocuments` parameter in sync request
2. Run sync in batches of 20-30 documents
3. Check internet connection stability
4. Increase timeout in [`app/api/drive/sync/route.ts`](app/api/drive/sync/route.ts#L6)

### TypeScript Errors
**Problem**: Build fails with TS errors

**Solution:**
```bash
npm run build
npm install --save-dev @types/uuid @types/papaparse
```

## 📝 Development Tips

### Testing Lead Extraction

Create test documents with clear lead information:
```
Company: Acme Corporation
Industry: Technology
Website: https://www.acme.com

Contact: John Doe
Title: CEO
Email: john@acme.com
Phone: +1-555-0123
```

### Monitoring Performance

Check logs for:
- Document upload progress
- File processing status
- API response times
- Confidence scores

### Debugging

Enable verbose logging:
```typescript
// In lib/gemini-file-search.ts
console.log('Debug:', uploadResult);
```

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Rotate API keys** regularly
3. **Use service accounts** instead of user OAuth for production
4. **Limit folder access** to only necessary documents
5. **Monitor API usage** to detect anomalies
6. **Validate extracted data** before using in production

## 📚 Additional Resources

- [Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Gemini File Search Guide](https://ai.google.dev/gemini-api/docs/file-search)
- [Google Drive API](https://developers.google.com/drive/api/guides/about-sdk)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Context7 MCP](https://github.com/upstash/context7-mcp)

## 🤝 Contributing

This is a POC (Proof of Concept) project. Enhancements welcome:
- [ ] Add support for more document types (HTML, XML)
- [ ] Implement caching for faster repeat queries
- [ ] Add batch processing UI with progress bars
- [ ] Create admin dashboard for sync management
- [ ] Add webhook support for automatic Drive sync
- [ ] Implement lead deduplication
- [ ] Add lead enrichment with external APIs

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- **Vercel AI SDK** for the chat framework
- **Google Gemini** for File Search and extraction
- **Anthropic** for the base reasoning preview template
- **Upstash** for Context7 MCP server

---

**Built with** ❤️ **using Next.js 15, Gemini 2.5 Pro, and Vercel AI SDK**

For questions or issues, please check the [Troubleshooting](#-troubleshooting) section or open an issue.
