# 日語學習卡片應用 / Japanese Vocabulary Learning Cards

> 一個使用 Google Gemini API 與 Text-to-Speech 的日語學習工具，支援平假名標注與自動卡片生成。透過 Vercel Serverless 架構安全管理 API 密鑰。  
> A Japanese vocabulary learning tool with Google Gemini API and Text-to-Speech integration. Features automatic furigana annotations and flashcard generation, with secure API key management via Vercel serverless architecture.

🌐 **Live Demo**: [https://nihongo-vocal-cards.vercel.app/](https://nihongo-vocal-cards.vercel.app/)

---

## 📖 目錄 / Table of Contents

- [中文說明](#中文說明)
- [English Documentation](#english-documentation)

---

## 中文說明

### 🎯 核心功能

- 📝 **卡片生成** - 輸入日語句子，自動生成學習卡片
- 🔤 **平假名標注** - HTML Ruby Tag 自動標註所有漢字讀音
- 🎤 **文本語音轉換** - 使用 Google Text-to-Speech API 生成朗讀音訊
- 💬 **文法評估** - 評估句子自然度並提供改進建議
- 🏷️ **標籤分類** - 整理學習卡片
- 💾 **本地存儲** - 無需登入即可使用，卡片資料存於本地端。作為個人學習紀錄工具，暫不支援跨裝置同步。

### 🎮 如何使用

1. 訪問 [https://nihongo-vocal-cards.vercel.app/](https://nihongo-vocal-cards.vercel.app/)
2. 在文本框輸入日語句子
3. 點擊「生成卡片」
4. 聆聽生成的朗讀音訊或查看改進建議
5. 卡片自動保存到本地瀏覽器

---

## 🏗️ 技術實作歷程

### 開發過程

這個專案從 Vibe Coding 開始，在 Google AI Studio 中快速實驗 Gemini API，產出雛形，使用 TypeScript 和 Tailwind CSS 開發，隨後拉至本地端再進行調整與最佳化，最後部署至 Vercel，並將 Gemini API Key 移至 Serverless Function 中管理，避免金鑰暴露於前端。

**關鍵技術決策：**

1. 初期：Google AI Studio 視覺化快速驗證想法
2. 本地化：React + TypeScript 前端，Vite 建構
3. 部署：意識到 API 密鑰安全風險 → 採用 Vercel Serverless Function

### 架構圖

```
┌─────────────────┐
│   用戶瀏覽器     │ ← React 前端，無 API 密鑰存儲
└────────┬────────┘
         │ fetch /api/generate
         ↓
┌─────────────────────────────┐
│ Vercel Serverless Function  │ ← 密鑰安全存儲於環境變數
│  (api/generate.js)          │
└────────┬────────────────────┘
         │ API 呼叫
         ↓
┌──────────────────────────┐
│ Google Gemini 2.5 Flash  │
│ + Text-to-Speech API     │
└──────────────────────────┘
```

### 架構特性

✅ **API Key 安全** - 前端無法存取
✅ **免維護部署** - 無需自行管理伺服器，由 Vercel 自動處理基礎設施
✅ **用戶隱私** - 卡片僅存儲在本地瀏覽器
✅ **快速響應** - 無需自建後端服務

---

## 📚 API 端點設計

應用通過單一端點 `/api/generate` 路由所有請求：

| 服務               | 參數                                                 | 說明         |
| ------------------ | ---------------------------------------------------- | ------------ |
| `service=generate` | `userInput`                                          | 生成完整卡片 |
| `service=feedback` | `originalInput`, `currentKanji`                      | 文法評估     |
| `service=improve`  | `title`, `kanji`, `grammarFeedback`, `originalInput` | 改進建議     |
| `service=speech`   | `text`, `voiceName`                                  | 生成語音     |

---

> ⚠️ **免費方案限制**：本專案使用 Gemini API Free Tier，`gemini-2.5-flash-tts` 每日請求上限為 10 次。超過後語音功能將暫停服務，待隔日額度重置後恢復。

<img width="2119" height="609" alt="Image" src="https://github.com/user-attachments/assets/9b39b376-ee20-4641-9ebf-65cf0048df26"/>

<img width="928" height="285" alt="Image" src="https://github.com/user-attachments/assets/d6911516-eb68-4f03-b43c-515cdda965e8"/>

<img width="938" height="495" alt="Image" src="https://github.com/user-attachments/assets/72110828-89a8-4976-838f-7447ba573e82"/>

## 🔐 API Key 安全性：核心工程挑戰

### 問題：直接在前端調用 API 的風險

最初的想法是在瀏覽器中直接呼叫 Google API：

```javascript
// ❌ 危險：API Key 暴露在瀏覽器中
const response = await fetch("https://generativelanguage.googleapis.com/...", {
  headers: {
    Authorization: "Bearer YOUR_API_KEY", // 任何用戶都能看到！
  },
});
```

**為什麼這是個問題：**

- 打開瀏覽器開發者工具即可看到所有 API 呼叫
- API 密鑰會被記錄在瀏覽歷史、伺服器日誌、CDN 記錄
- 任何人都可以截獲密鑰並濫用 API

### 解決方案：Serverless 後端代理

透過 Vercel Serverless Function 建立安全的 API 代理層：

```javascript
// ✅ 安全：API Key 只在伺服器端
export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_AI_API_KEY; // 環境變數
  // 僅在伺服器上執行 API 呼叫
  // 前端只接收最終結果
}
```

**資料流：**

```
前端請求 → Vercel 後端 → Google API
(無密鑰)   (密鑰保護)
```

### 實現細節

1. **環境變數管理** - 密鑰存儲在 Vercel 環境變數，永不進入程式碼
2. **伺服器端驗證** - 後端驗證所有請求參數
3. **無日誌記錄** - Vercel 不記錄敏感環境變數
4. **請求方法** - 使用 POST 防止 URL 中洩露參數

### 部署安全檢查清單

- ✅ `GOOGLE_AI_API_KEY` 在 Vercel 環境變數設定（不在程式碼中）
- ✅ `.env.local` 已添加到 `.gitignore`
- ✅ 無密鑰在 Git 提交歷史中
- ✅ API 端點使用 POST 方法
- ✅ 伺服器驗證所有輸入參數

---

## 📂 專案結構

```
nihongo-vocal-cards/
├── api/
│   └── generate.js              # [後端] Vercel Serverless Function，呼叫 Google API
├── src/
│   ├── services/
│   │   └── geminiService.ts     # [中介層] 封裝 fetch 請求，串接前後端
│   ├── components/              # [前端] React UI 元件
│   ├── hooks/
│   │   └── useTTS.ts            # [前端] 語音播放邏輯，呼叫 geminiService
│   └── App.tsx                  # [前端] 主應用程式
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## English Documentation

### 🎯 Core Features

- 📝 **Card Generation** - Generate learning cards from Japanese sentences
- 🔤 **Furigana** - Auto-annotate kanji with ruby tags
- 🎤 **Text-to-Speech** - Google Text-to-Speech API audio generation
- 💬 **Grammar Assessment** - Evaluate naturalness and suggest improvements
- 🏷️ **Tag Organization** - Organize your flashcards
- 💾 **Local Storage** - No login required. Cards are stored locally in your browser. As a personal learning record tool, cross-device syncing is not currently supported.

### 🎮 How to Use

1. Visit [https://nihongo-vocal-cards.vercel.app/](https://nihongo-vocal-cards.vercel.app/)
2. Enter a Japanese sentence
3. Click "Generate Card"
4. Listen to generated speech or view suggestions
5. Cards are saved locally to your browser

---

## 🏗️ Technical Implementation

### Development Journey

This project began as **vibe coding** — rapid prototyping in Google AI Studio with Gemini API, then scaled to local development using React, TypeScript, and Tailwind CSS for styling. Finally deployed to Vercel with a serverless architecture that solved the critical challenge: **managing API keys securely and preventing exposure on the frontend**.

**Key Technical Decisions:**

1. Prototyping: Google AI Studio for quick validation
2. Local Development: React + TypeScript frontend with Vite build tool and Tailwind CSS styling
3. Production: Recognized API key exposure risk → Implemented Vercel Serverless Function as secure proxy

### Architecture Diagram

```
┌─────────────────┐
│   User Browser  │ ← React frontend, no API keys stored
└────────┬────────┘
         │ fetch /api/generate
         ↓
┌─────────────────────────────┐
│ Vercel Serverless Function  │ ← Keys safely in environment variables
│  (api/generate.js)          │
└────────┬────────────────────┘
         │ API calls
         ↓
┌──────────────────────────┐
│ Google Gemini 2.5 Flash  │
│ + Text-to-Speech API     │
└──────────────────────────┘
```

### Architecture Features

✅ **API Key Security** - Frontend has zero access to credentials
✅ **Serverless Deployment** - Vercel automatically manages infrastructure
✅ **User Privacy** - Card data stored only locally in browser

---

## 📚 API Endpoint Design

All requests route through a single endpoint `/api/generate`:

| Service            | Parameters                                           | Function                |
| ------------------ | ---------------------------------------------------- | ----------------------- |
| `service=generate` | `userInput`                                          | Generate complete card  |
| `service=feedback` | `originalInput`, `currentKanji`                      | Grammar assessment      |
| `service=improve`  | `title`, `kanji`, `grammarFeedback`, `originalInput` | Improvement suggestions |
| `service=speech`   | `text`, `voiceName`                                  | Generate speech audio   |

---

> ⚠️ **Free Tier Limitation**: This project uses the Gemini API Free Tier. The `gemini-2.5-flash-tts` model has a daily limit of 10 requests. Once exceeded, the Text-to-Speech feature will be unavailable until the quota resets the following day.

<img width="2119" height="609" alt="Image" src="https://github.com/user-attachments/assets/9b39b376-ee20-4641-9ebf-65cf0048df26"/>

<img width="928" height="285" alt="Image" src="https://github.com/user-attachments/assets/d6911516-eb68-4f03-b43c-515cdda965e8"/>

<img width="938" height="495" alt="Image" src="https://github.com/user-attachments/assets/72110828-89a8-4976-838f-7447ba573e82"/>

## 🔐 API Key Security Management: Core Engineering Challenge

### The Problem: Direct Frontend API Calls

Initial approach: Call Google API directly from the browser:

```javascript
// ❌ Unsafe: API key exposed in browser
const response = await fetch("https://generativelanguage.googleapis.com/...", {
  headers: {
    Authorization: "Bearer YOUR_API_KEY", // Visible to all users!
  },
});
```

**Why this is problematic:**

- Browser DevTools immediately reveals all API calls
- API keys appear in browser history, server logs, CDN records
- Anyone can intercept the key and abuse the API

### Solution: Serverless Backend Proxy

Create a secure API proxy layer via Vercel Serverless Function:

```javascript
// ✅ Safe: API key only exists on server
export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_AI_API_KEY; // Environment variable
  // API calls execute only on server
  // Frontend receives only final result
}
```

**Data Flow:**

```
Frontend Request → Vercel Backend → Google API
(No key)         (Key protected)
```

### Implementation Details

1. **Environment Variables** - API keys stored in Vercel environment variables, never hardcoded
2. **Server-side Validation** - Backend validates all request parameters before processing
3. **No Logging** - Vercel doesn't record sensitive environment variables
4. **POST Method** - Uses POST requests to prevent parameter leakage in URLs

### Deployment Security Checklist

- ✅ `GOOGLE_AI_API_KEY` configured in Vercel environment variables (not in code)
- ✅ `.env.local` added to `.gitignore`
- ✅ No API keys in Git commit history
- ✅ API endpoints use POST method
- ✅ Server validates all input parameters

---

## 📂 Project Structure

```
nihongo-vocal-cards/
├── api/
│   └── generate.js              # [Backend] Vercel Serverless Function — calls Google API
├── src/
│   ├── services/
│   │   └── geminiService.ts     # [Service Layer] Wraps fetch requests, bridges frontend and backend
│   ├── components/              # [Frontend] React UI components
│   ├── hooks/
│   │   └── useTTS.ts            # [Frontend] Speech playback logic, calls geminiService
│   └── App.tsx                  # [Frontend] Main application
├── vite.config.ts
├── tsconfig.json
└── package.json
```
