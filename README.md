# AI Journalist Agent

An AI-powered SaaS application that researches, writes, and edits newsroom-ready articles automatically.

Built with Next.js 14, TypeScript, Tailwind CSS, and OpenAI GPT-4o.

## Features

- **AI-Powered Research** — Automatically searches the web for relevant sources via SerpAPI
- **Intelligent Article Writing** — Generates structured, factual, and engaging articles using GPT-4o
- **Editorial-Grade Refinement** — Polishes content to professional journalism standards

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and add your API keys:

```bash
cp .env.example .env.local
```

Required keys:

- `OPENAI_API_KEY` — Your OpenAI API key (https://platform.openai.com/api-keys)
- `SERPAPI_API_KEY` — Your SerpAPI key (https://serpapi.com/manage-api-key)

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the marketing homepage.

Navigate to [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to use the AI Journalist Agent.

## Project Structure

```
app/
├── page.tsx                  # Marketing homepage
├── layout.tsx                # Root layout
├── globals.css               # Global styles
├── dashboard/
│   └── page.tsx              # AI Journalist Agent dashboard
└── api/
    └── generate/
        └── route.ts          # AI agent orchestration endpoint
```

## How It Works

The AI agent runs three sequential steps:

1. **Searcher** — Generates search queries from the topic, fetches results from SerpAPI
2. **Writer** — Uses GPT-4o to write a structured article draft from research data
3. **Editor** — Refines tone, clarity, and structure to journalism standards

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- OpenAI GPT-4o
- SerpAPI
- Lucide React (icons)
