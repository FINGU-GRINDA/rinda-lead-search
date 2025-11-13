# 🔍 Rinda Lead Search - AI-Powered Lead Extraction

[![Next.js](https://img.shields.io/badge/Next.js-15.1.7-black)](https://nextjs.org/)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Pro-blue)](https://ai.google.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

AI 기반 리드 추출 시스템 - Google Drive 문서에서 회사 정보와 연락처를 자동으로 추출합니다.

An AI-powered lead extraction system that automatically extracts company information and contacts from Google Drive documents.

---

## 📖 Table of Contents

- [🇰🇷 한국어 문서](#-한국어-문서)
- [🇺🇸 English Documentation](#-english-documentation)

---

# 🇰🇷 한국어 문서

## 🎯 주요 기능

- **🔄 Google Drive 연동**: 자동으로 문서를 동기화하고 처리
- **🤖 AI 리드 추출**: Gemini 2.5 Pro로 정확한 정보 추출
- **💬 채팅 인터페이스**: 자연어로 리드 검색 ("일본 뷰티 유통사 찾아줘")
- **📊 신뢰도 점수**: 각 리드의 정확도를 0-100% 점수로 표시
- **📥 CSV 내보내기**: 추출된 리드를 CSV 파일로 다운로드
- **🌐 다국어 지원**: 한국어, 영어, 일본어 검색 지원

## 🏗️ 시스템 구조

```
Google Drive (CSV/TXT 파일)
        ↓
    파일 다운로드
        ↓
    텍스트 추출 (최대 50KB/파일)
        ↓
    Gemini 2.5 Pro API
        ↓
    구조화된 리드 데이터
        ↓
    채팅 인터페이스 표시
```

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

```bash
# 저장소 클론
git clone https://github.com/your-username/rinda-lead-search.git
cd rinda-lead-search

# 의존성 설치
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력:

```env
# Gemini API 키 (필수)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Google Drive 서비스 계정 (필수)
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Drive 폴더 ID (필수)
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here

# Anthropic API (선택사항 - Claude 모델 사용시)
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### 4. Google Cloud 설정

#### A. Gemini API 키 발급
1. [Google AI Studio](https://aistudio.google.com/apikey) 방문
2. "API 키 가져오기" 클릭
3. 키를 복사하여 `.env.local`에 저장

#### B. 서비스 계정 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 방문
2. "IAM 및 관리자" → "서비스 계정" 선택
3. "서비스 계정 만들기" 클릭
4. 이름 입력 후 "만들기 및 계속" 클릭
5. "키" 탭에서 "키 추가" → "새 키 만들기" → "JSON" 선택
6. 다운로드한 JSON 파일에서 `client_email`과 `private_key` 복사

#### C. Google Drive 폴더 공유
1. Google Drive에서 리드 문서가 있는 폴더 열기
2. "공유" 클릭
3. 서비스 계정 이메일 추가
4. "뷰어" 또는 "편집자" 권한 부여
5. 폴더 URL에서 폴더 ID 복사

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 열기

## 💡 사용 방법

### 1. Google Drive 동기화

앱을 처음 실행하면 "Google Drive 동기화" 버튼이 표시됩니다:

1. **"Google Drive 동기화"** 버튼 클릭
2. 동기화 진행 상황 확인
3. 완료되면 파일 개수가 표시됨

### 2. 리드 검색

채팅창에 자연어로 검색:

```
일본 뷰티 유통사 찾아줘
한국 IT 기업 연락처 알려줘
이메일 주소가 있는 회사 찾아줘
제조사 리스트 뽑아줘
```

### 3. 결과 확인

- 각 리드는 카드 형태로 표시
- 신뢰도 점수 색상:
  - 🟢 **초록색 (80% 이상)**: 높은 신뢰도
  - 🟡 **노란색 (60-80%)**: 중간 신뢰도
  - 🔴 **빨간색 (60% 미만)**: 낮은 신뢰도

### 4. CSV 내보내기

"CSV로 내보내기" 버튼을 클릭하여 모든 리드 다운로드

## 🛠️ 지원 파일 형식

현재 버전에서 지원:
- **CSV** (권장) - 구조화된 데이터에 최적
- **TXT** - 일반 텍스트 문서

향후 지원 예정:
- PDF, DOCX, XLSX (구현 준비 완료)

## 📊 성능 및 제한사항

- **파일 처리**: 한 번에 최대 10개 파일
- **파일 크기**: 각 파일당 50KB까지 읽기 (대용량 파일은 자동 잘림)
- **응답 시간**: 일반적으로 2-3분 (파일 개수에 따라 다름)
- **정확도 목표**: 80% 이상

## 🔧 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 시작
npm start

# Google Drive 동기화 테스트
npm run sync:drive

# 증분 동기화
npm run sync:incremental

# 스모크 테스트
npm run test:smoke
```

## 🐛 문제 해결

### Google Drive 접근 오류

**증상**: "Google Drive 폴더에 접근할 수 없습니다"

**해결책**:
1. 서비스 계정 이메일이 정확한지 확인
2. 폴더가 서비스 계정과 공유되었는지 확인
3. 폴더 ID가 올바른지 확인

### 리드가 추출되지 않음

**증상**: 검색해도 결과가 0개

**해결책**:
1. Google Drive 동기화가 완료되었는지 확인
2. 문서에 회사명, 이메일 등 리드 정보가 있는지 확인
3. 더 구체적인 검색어 사용 (예: "이메일이 있는 회사")

### Gemini API 오류

**증상**: "API 호출 실패"

**해결책**:
1. Gemini API 키가 유효한지 확인
2. API 할당량을 확인
3. [Google AI Studio](https://aistudio.google.com/apikey)에서 키 재생성

## 📁 프로젝트 구조

```
rinda-lead-search/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # 채팅 API (리드 검색 통합)
│   │   ├── drive/                     # Drive 동기화 API
│   │   ├── leads/                     # 리드 검색/내보내기 API
│   │   └── health/route.ts            # 헬스 체크
│   ├── page.tsx                       # 메인 페이지
│   └── layout.tsx                     # 레이아웃
├── components/
│   ├── chat-simple.tsx                # 채팅 인터페이스
│   ├── lead-results.tsx               # 리드 결과 표시
│   ├── sync-drive-button.tsx          # 동기화 버튼
│   └── export-button.tsx              # CSV 내보내기 버튼
├── lib/
│   ├── gemini-file-search.ts          # Gemini API 클라이언트
│   ├── google-drive.ts                # Google Drive 클라이언트
│   ├── lead-extractor.ts              # 리드 추출 로직
│   └── schemas/lead.ts                # 데이터 스키마
├── scripts/
│   ├── init-drive-sync.ts             # 초기 동기화
│   └── incremental-sync.ts            # 증분 동기화
└── .env.local                         # 환경 변수 (gitignored)
```

## 🔐 보안

- ✅ `.env.local` 파일은 절대 커밋하지 않음
- ✅ API 키는 정기적으로 교체
- ✅ 서비스 계정 사용 (사용자 OAuth 대신)
- ✅ 최소 권한 원칙 적용

## 🤝 기여하기

이 프로젝트는 POC(Proof of Concept)입니다. 개선 제안은 언제나 환영합니다!

향후 개선 사항:
- [ ] PDF, DOCX, XLSX 파일 지원 확대
- [ ] 리드 중복 제거 기능
- [ ] 배치 처리 UI 개선
- [ ] 웹훅을 통한 자동 동기화
- [ ] 리드 enrichment (외부 API 연동)

## 📄 라이선스

MIT License - 자세한 내용은 LICENSE 파일 참조

---

# 🇺🇸 English Documentation

## 🎯 Key Features

- **🔄 Google Drive Integration**: Automatically sync and process documents
- **🤖 AI Lead Extraction**: Accurate extraction using Gemini 2.5 Pro
- **💬 Chat Interface**: Natural language search ("Find Japanese beauty distributors")
- **📊 Confidence Scores**: 0-100% accuracy rating for each lead
- **📥 CSV Export**: Download extracted leads as CSV files
- **🌐 Multilingual**: Supports Korean, English, and Japanese queries

## 🏗️ System Architecture

```
Google Drive (CSV/TXT Files)
        ↓
    Download Files
        ↓
    Extract Text (Max 50KB/file)
        ↓
    Gemini 2.5 Pro API
        ↓
    Structured Lead Data
        ↓
    Display in Chat Interface
```

### Extracted Information

**Company Information:**
- Name, Industry
- Size, Website
- Location, Description

**Contact Information:**
- Name, Title
- Email, Phone
- LinkedIn Profile

## 🚀 Quick Start

### 1. Prerequisites

- Node.js 20.x or higher
- Google Cloud Project
- Google Drive API access
- Gemini API key

### 2. Installation

```bash
# Clone repository
git clone https://github.com/your-username/rinda-lead-search.git
cd rinda-lead-search

# Install dependencies
npm install
```

### 3. Environment Setup

Create `.env.local` file:

```env
# Gemini API Key (Required)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Google Drive Service Account (Required)
GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Google Drive Folder ID (Required)
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here

# Anthropic API (Optional - for Claude models)
ANTHROPIC_API_KEY=your_anthropic_key_here
```

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

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser

## 💡 Usage

### 1. Sync Google Drive

When you first run the app, you'll see a "Sync Google Drive" button:

1. Click **"Sync Google Drive"** button
2. Monitor sync progress
3. File count will be displayed when complete

### 2. Search for Leads

Use natural language in the chat:

```
Find Japanese beauty distributors
Show me Korean IT companies
Companies with email addresses
List manufacturers
```

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

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Test Google Drive sync
npm run sync:drive

# Incremental sync
npm run sync:incremental

# Smoke tests
npm run test:smoke
```

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

```
rinda-lead-search/
├── app/
│   ├── api/
│   │   ├── chat/route.ts              # Chat API (with lead search)
│   │   ├── drive/                     # Drive sync APIs
│   │   ├── leads/                     # Lead search/export APIs
│   │   └── health/route.ts            # Health check
│   ├── page.tsx                       # Main page
│   └── layout.tsx                     # Layout
├── components/
│   ├── chat-simple.tsx                # Chat interface
│   ├── lead-results.tsx               # Lead display
│   ├── sync-drive-button.tsx          # Sync button
│   └── export-button.tsx              # CSV export
├── lib/
│   ├── gemini-file-search.ts          # Gemini API client
│   ├── google-drive.ts                # Google Drive client
│   ├── lead-extractor.ts              # Lead extraction logic
│   └── schemas/lead.ts                # Data schemas
├── scripts/
│   ├── init-drive-sync.ts             # Initial sync
│   └── incremental-sync.ts            # Incremental sync
└── .env.local                         # Environment variables (gitignored)
```

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

---

**Built with** ❤️ **using Next.js 15, Gemini 2.5 Pro, and Vercel AI SDK**

For questions or issues, please check the [Troubleshooting](#-troubleshooting) section.
