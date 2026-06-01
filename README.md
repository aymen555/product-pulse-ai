# ⚡ Product Pulse AI

> Understand what people really think about any product — in seconds.

AI-powered product sentiment analysis using YouTube comments + GPT-4o-mini.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local and add your API keys

# 3. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🔑 Required: API Keys

### OpenAI (Required)
- Go to https://platform.openai.com/api-keys
- Create an API key
- Add to `.env.local` as `OPENAI_API_KEY`

### YouTube Data API v3 (Recommended)
- Go to https://console.cloud.google.com
- Create a project → Enable "YouTube Data API v3"
- Create credentials → API Key
- Add to `.env.local` as `YOUTUBE_API_KEY`
- **Without this**: app uses AI training knowledge (still works, but not real-time)
- **With this**: app fetches real YouTube comments for much better accuracy

## 📁 Project Structure

```
product-pulse-ai/
├── app/
│   ├── page.tsx              # Homepage with search
│   ├── results/page.tsx      # Analysis dashboard
│   ├── api/analyze/route.ts  # Core API endpoint
│   ├── globals.css           # Design system
│   └── layout.tsx            # Root layout
├── lib/
│   ├── prompt.ts             # AI prompt templates
│   ├── rateLimit.ts          # IP-based rate limiting
│   └── youtube.ts            # YouTube Data API client
├── types/
│   └── analysis.ts           # TypeScript interfaces
└── .env.local                # Your API keys (never commit!)
```

## 🛡️ API Security

- Rate limited: 10 requests/minute per IP
- Input validation + sanitization
- No API keys exposed to client
- Error messages don't leak internals

## 📊 What Users See

1. **Overall Score** (0–100) — weighted sentiment ring
2. **Sentiment Breakdown** — positive/neutral/negative %
3. **AI Market Insight** — one actionable sentence
4. **Hot Topics** — color-coded by sentiment
5. **What People Love** — top positives
6. **Common Complaints** — top issues

## 🔮 Roadmap

- [ ] Reddit integration (PRAW)
- [ ] Product comparison (A vs B)
- [ ] Trend tracking over time
- [ ] Export reports as PDF
- [ ] API access for businesses
