# 🔍 Rinda Lead Search - AI-Powered Lead Extraction

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Pro-blue)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

AI 기반 리드 추출 시스템 - Google Drive 문서에서 회사 정보와 연락처를 자동으로 추출합니다.

An AI-powered lead extraction system that automatically extracts company information and contacts from Google Drive documents.

***REMOVED***

## 📖 Table of Contents

- [🇰🇷 한국어 문서](#-한국어-문서)
- [🇺🇸 English Documentation](#-english-documentation)

***REMOVED***

# 🇰🇷 한국어 문서

## 🎯 주요 기능

- **🔄 Google Drive 연동**: 자동으로 문서를 동기화하고 처리
- **🤖 AI 리드 추출**: Gemini 2.5 Pro로 정확한 정보 추출
- **💬 채팅 인터페이스**: 자연어로 리드 검색 ("***REMOVED***")
- **📊 신뢰도 점수**: 각 리드의 정확도를 0-100% 점수로 표시
- **📥 CSV 내보내기**: 추출된 리드를 CSV 파일로 다운로드
- **🌐 다국어 지원**: 한국어, 영어, 일본어 검색 지원

## 🏗️ 시스템 구조

***REMOVED***
Google Drive (CSV/TXT 파일)
***REMOVED***
    파일 다운로드
***REMOVED***
    텍스트 추출 (최대 50KB/파일)
***REMOVED***
***REMOVED***
***REMOVED***
    구조화된 리드 데이터
***REMOVED***
    채팅 인터페이스 표시
***REMOVED***

### 추출되는 정보

**회사 정보:**
- 회사명, 산업/업종
- 회사 규모, 웹사이트
- 위치, 설명

**연락처 정보:**
- 이름, 직책
- 이메일, 전화번호
- LinkedIn 프로필

## 🚀 빠른 시작

### 1. 필수 요구사항

- Node.js 20.x 이상
- Google Cloud 프로젝트
- Google Drive API 접근 권한
- Gemini API 키

### 2. 설치

***REMOVED***bash
# 저장소 클론
***REMOVED***
***REMOVED***

# 의존성 설치
***REMOVED***
***REMOVED***

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력:

***REMOVED***env
# Gemini API 키 (필수)
***REMOVED***

# Google Drive 서비스 계정 (필수)
***REMOVED***
GOOGLE_DRIVE_PRIVATE_KEY="***REMOVED***--BEGIN PRIVATE KEY***REMOVED***--\n...\n***REMOVED***--END PRIVATE KEY***REMOVED***--\n"

***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***bash
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***bash
***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
│   └── incremental-sync.ts            ***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***bash
***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***
***REMOVED***

***REMOVED***

***REMOVED***

***REMOVED***env
***REMOVED***
***REMOVED***

***REMOVED***
***REMOVED***
GOOGLE_DRIVE_PRIVATE_KEY="***REMOVED***--BEGIN PRIVATE KEY***REMOVED***--\n...\n***REMOVED***--END PRIVATE KEY***REMOVED***--\n"

# Google Drive Folder ID (Required)
***REMOVED***

# Anthropic API (Optional - for Claude models)
***REMOVED***
***REMOVED***

### 4. Google Cloud Setup

#### A. Get Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/apikey)
2. Click "Get API Key"
3. Copy and save to `.env.local`

#### B. Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "IAM & Admin" → "Service Accounts"
3. Click "Create Service Account"
4. Enter name and click "Create and Continue"
5. In "Keys" tab, click "Add Key" → "Create New Key" → "JSON"
6. Copy `client_email` and `private_key` from downloaded JSON

#### C. Share Google Drive Folder
1. Open your Google Drive folder with lead documents
2. Click "Share"
3. Add service account email
4. Grant "Viewer" or "Editor" permission
5. Copy folder ID from URL

### 5. Run Development Server

***REMOVED***bash
***REMOVED***
***REMOVED***

Open [http://localhost:3000](http://localhost:3000) in your browser

## 💡 Usage

### 1. Sync Google Drive

When you first run the app, you'll see a "Sync Google Drive" button:

1. Click **"Sync Google Drive"** button
2. Monitor sync progress
3. File count will be displayed when complete

### 2. Search for Leads

Use natural language in the chat:

***REMOVED***
Find Japanese beauty distributors
Show me Korean IT companies
Companies with email addresses
List manufacturers
***REMOVED***

### 3. View Results

- Each lead is displayed as a card
- Confidence score colors:
  - 🟢 **Green (80%+)**: High confidence
  - 🟡 **Yellow (60-80%)**: Medium confidence
  - 🔴 **Red (<60%)**: Low confidence

### 4. Export to CSV

Click "Export to CSV" button to download all leads

## 🛠️ Supported File Formats

Currently supported:
- **CSV** (Recommended) - Best for structured data
- **TXT** - Plain text documents

Coming soon:
- PDF, DOCX, XLSX (Implementation ready)

## 📊 Performance & Limits

- **File Processing**: Up to 10 files at once
- **File Size**: 50KB per file (large files auto-truncated)
- **Response Time**: Typically 2-3 minutes (depends on file count)
- **Accuracy Target**: 80%+

## 🔧 Scripts

***REMOVED***bash
# Start development server
***REMOVED***

# Build for production
***REMOVED***

# Start production server
***REMOVED***

# Test Google Drive sync
***REMOVED***

# Incremental sync
***REMOVED***

# Smoke tests
***REMOVED***
***REMOVED***

## 🐛 Troubleshooting

### Google Drive Access Error

**Symptom**: "Cannot access Google Drive folder"

**Solution**:
1. Verify service account email is correct
2. Check folder is shared with service account
3. Confirm folder ID is accurate

### No Leads Extracted

**Symptom**: Search returns 0 results

**Solution**:
1. Ensure Google Drive sync completed
2. Verify documents contain lead information (company names, emails, etc.)
3. Use more specific search terms (e.g., "companies with emails")

### Gemini API Error

**Symptom**: "API call failed"

**Solution**:
1. Verify Gemini API key is valid
2. Check API quotas
3. Regenerate key at [Google AI Studio](https://aistudio.google.com/apikey)

## 📁 Project Structure

***REMOVED***
***REMOVED***
***REMOVED***
***REMOVED***
│   │   ├── chat/route.ts              # Chat API (with lead search)
│   │   ├── drive/                     # Drive sync APIs
│   │   ├── leads/                     # Lead search/export APIs
│   │   └── health/route.ts            # Health check
│   ├── page.tsx                       # Main page
│   └── layout.tsx                     # Layout
***REMOVED***
│   ├── chat-simple.tsx                # Chat interface
│   ├── lead-results.tsx               # Lead display
│   ├── sync-drive-button.tsx          # Sync button
│   └── export-button.tsx              # CSV export
***REMOVED***
│   ├── gemini-file-search.ts          # Gemini API client
│   ├── google-drive.ts                # Google Drive client
│   ├── lead-extractor.ts              # Lead extraction logic
│   └── schemas/lead.ts                # Data schemas
***REMOVED***
│   ├── init-drive-sync.ts             # Initial sync
│   └── incremental-sync.ts            # Incremental sync
└── .env.local                         # Environment variables (gitignored)
***REMOVED***

## 🔐 Security

- ✅ Never commit `.env.local` file
- ✅ Rotate API keys regularly
- ✅ Use service accounts (not user OAuth)
- ✅ Apply principle of least privilege

## 🤝 Contributing

This is a POC (Proof of Concept) project. Contributions are welcome!

Roadmap:
- [ ] Expand PDF, DOCX, XLSX support
- [ ] Lead deduplication
- [ ] Batch processing UI improvements
- [ ] Automatic sync via webhooks
- [ ] Lead enrichment (external API integration)

## 📄 License

MIT License - See LICENSE file for details

***REMOVED***

**Built with** ❤️ **using Next.js 15, Gemini 2.5 Pro, and Vercel AI SDK**

For questions or issues, please check the [Troubleshooting](#-troubleshooting) section.
