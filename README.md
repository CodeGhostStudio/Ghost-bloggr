<div align="center">

```text
  ___ _  _  ___  ___ _____   ___ _    ___   ___  ___ ___ 
 / __| || |/ _ \/ __|_   _| | _ ) |  / _ \ / __|/ __| _ \
| (_ | __ | (_) \__ \ | |   | _ \ |_| (_) | (_ | (_ |   /
 \___|_||_|\___/|___/ |_|   |___/____\___/ \___|\___|_|_\
```

<img src="https://cloud.ghostwriterz.shop/f/d5fd0f5b870d495e/1795710743696.jpg" alt="Ghost Bloggr Banner" width="100%" />

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=flat-square&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

**A local-first Markdown & rich-text blogging studio with flexible server or BYOK AI workflows.**

</div>

---

## Overview

**Ghost Bloggr** is a browser-based writing studio built for technical writers, bloggers, and developers who want full ownership of their drafts and AI keys. Write in rich text or live Markdown, manage custom AI writing personas, and export clean files—all without a database or user account.

---

## Workspace Architecture

```text
+-----------------------------------------------------------------------------+
|                            BROWSER (CLIENT-SIDE)                            |
|                                                                             |
|  +---------------------------+        +----------------------------------+  |
|  |      WRITING STUDIO       |        |       AI ASSISTANT DRAWER        |  |
|  |                           |        |                                  |  |
|  |  * Rich-Text / Markdown   |<------>|  * Tools (Ideas, SEO, Rewrite,   |  |
|  |  * YAML Frontmatter       |        |    Expand, Full Draft)           |  |
|  |  * Auto-Link & Image Drop |        |  * Writing Coach Chat            |  |
|  +-------------+-------------+        |  * Prompt Library                |  |
|                |                      |  * Custom Writing Agents         |  |
|                v                      +----------------+-----------------+  |
|  +---------------------------+                         |                    |
|  |   LOCAL BROWSER STORAGE   |                         |                    |
|  |      (localStorage)       |                         |                    |
|  |                           |                         |                    |
|  |  * Drafts & Post Library  |                         |                    |
|  |  * Custom Prompts/Agents  |                         |                    |
|  |  * BYOK API Keys & Config |                         |                    |
|  +---------------------------+                         |                    |
+--------------------------------------------------------|--------------------+
                                                         |
                         +-------------------------------+
                         |  AI Provider Routing (User Choice)
                         v
        +---------------------------------+-------------------------------+
        | [Option A: Built-in Server]     | [Option B: Client-Side BYOK]  |
        v                                 v                               |
+-------------------------------+  +--------------------------------------+
|    Next.js API Route          |  | Direct Browser Fetch / Localhost     |
|    POST /api/gemini           |  |                                      |
|    (Uses GEMINI_API_KEY)      |  | * OpenRouter                         |
+-------------------------------+  | * Requesty                           |
                                   | * Google Gemini API                  |
                                   | * Local Ollama / LM Studio           |
                                   +--------------------------------------+
```

---

## Core Features

- **Dual-Mode Writing Studio:** Switch between a rich-text editor and a live Markdown preview with toggleable YAML frontmatter (`title`, `date`, `tags`, `description`, etc.).
- **Smart Link & Image Handling:**
  - Automatically converts pasted or typed URLs into formatted links.
  - Supports drag-and-drop and modal image insertion (`PNG`, `JPEG`, `WebP`, `GIF`, `AVIF`) with automatic client-side image resizing to keep local storage lean.
- **AI Assistant Drawer:**
  - **Built-in Tools:** Idea generator, SEO headline suggestions, paragraph rewriter, section expander, and full draft generation.
  - **Writing Coach Chat:** Context-aware conversational feedback alongside your active document.
  - **Prompt Library:** Save, edit, and reuse your favorite custom prompts.
  - **Writing Agents:** Create specialized AI personas with custom system instructions and per-agent model overrides.
- **Flexible AI Backend:**
  - **Built-in Gemini:** Route requests through the server-side `/api/gemini` endpoint using your host's `GEMINI_API_KEY`.
  - **Client-Side BYOK (Bring Your Own Key):** Connect directly from your browser to **OpenRouter**, **Requesty**, **Google Gemini**, or local inference servers (**Ollama** / **LM Studio**).
- **Local-First Privacy:** Drafts, saved posts, custom prompts, writing agents, and BYOK API keys are stored exclusively in your browser's `localStorage`. Nothing is persisted on an external server.
- **One-Click Exports:** Copy raw Markdown to your clipboard or download your post as `.md`, standalone `.html`, or formatted `.pdf`.
- **Standalone PWA:** Installable on desktop and mobile with Light/Dark themes and a distraction-free Focus Mode.

---

## Quick Start

### 1. Clone the repository

```bash
git clone [https://github.com/CodeGhostStudio/GhostBloggr.git](https://github.com/CodeGhostStudio/GhostBloggr.git)
cd GhostBloggr
```

### 2. Install dependencies

```bash
npm install
# or
bun install
```

### 3. Configure environment variables (Optional)

If you want to enable the built-in server-side Gemini endpoint, create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Add your Google Gemini API key:

```env
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> **Note:** This step is optional. If `GEMINI_API_KEY` is omitted, you can configure your own API keys or local Ollama/LM Studio endpoints directly inside the app's **Settings** menu.

### 4. Start the development server

```bash
npm run dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tech Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 15 (App Router) | Routing, SSR shell, and `/api/gemini` proxy endpoint |
| **Language** | TypeScript | End-to-end type safety |
| **Styling** | Tailwind CSS | Responsive layout, Light/Dark themes, and typography |
| **State & Storage** | Browser `localStorage` | Local persistence for drafts, agents, prompts, and keys |
| **AI Integrations** | Gemini SDK / Fetch API | Server-side Gemini + client-side OpenRouter/Requesty/Ollama |
| **PWA** | Web App Manifest & Service Worker | Offline caching and standalone app installation |

---

## Project Structure

```text
GhostBloggr/
├── app/
│   ├── api/
│   │   └── gemini/          # Server-side route handler for GEMINI_API_KEY
│   ├── layout.tsx           # Root layout, theme provider, and PWA metadata
│   ├── page.tsx             # Main studio workspace entry point
│   └── globals.css          # Tailwind directives and editor typography styles
├── components/
│   ├── ai/                  # AI Assistant drawer, Coach chat, Prompt & Agent managers
│   ├── editor/              # Rich-text/Markdown editor, YAML frontmatter, image modal
│   ├── export/              # Markdown, HTML, and PDF export utilities & modals
│   └── ui/                  # Shared layout shells, theme toggles, and Focus Mode controls
├── hooks/
│   ├── useLocalStorage.ts   # Typed browser storage synchronization
│   ├── useAiProvider.ts     # Routing logic between /api/gemini and BYOK endpoints
│   └── useImageResize.ts    # Client-side canvas image compression/resizing
└── lib/
    ├── markdown.ts          # Markdown parsing, serialization, and auto-link helpers
    ├── export.ts            # Standalone HTML and PDF document generators
    └── types.ts             # Core TypeScript interfaces for posts, prompts, and agents
```

---

## Deploying to Vercel

You can deploy your own instance of Ghost Bloggr to Vercel in a few clicks:

1. Push your fork or clone of `CodeGhostStudio/GhostBloggr` to GitHub.
2. Import the repository into your [Vercel Dashboard](https://vercel.com/new).
3. *(Optional)* To enable the built-in server-side Gemini integration for yourself or visitors, expand **Environment Variables** and add:
   - **Name:** `GEMINI_API_KEY`
   - **Value:** `your_google_gemini_api_key`
4. Click **Deploy**.

If you leave `GEMINI_API_KEY` unset in Vercel, the app still deploys cleanly and operates in pure BYOK / local-model mode via browser settings.

---

## License

Released under the [MIT License](LICENSE).
