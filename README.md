# Brief Writer — a Claude-powered marketing agent

A working prototype that turns rough campaign ideas into structured creative briefs.
Built as a prompt-engineering portfolio piece.

## What it does

Stakeholder pastes a rough campaign idea (a fragment, a paragraph, anything in
between). The agent:

- Reasons through five strategic questions in a hidden `<thinking>` block
- Produces a structured brief conforming to a strict JSON schema
- Refuses off-task requests, asks for clarification on sparse ones, flags
  regulated topics for compliance review
- Marks unknowable fields as "TO CONFIRM" rather than fabricating

The JSON schema is the contract between this agent and any downstream agent
(content production, QA, measurement).

## Run locally

You'll need Node 18+ and an Anthropic API key.

```bash
npm install -g vercel
cd brief-writer-demo
vercel dev
```

Then open http://localhost:3000.

Set your API key as an environment variable: `ANTHROPIC_API_KEY=sk-ant-...`

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com, click "Add New Project", import the repo
3. In the project settings, add an environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your key from console.anthropic.com
4. Click Deploy

Vercel gives you a URL like `brief-writer-demo.vercel.app` — that's the link
you put on your CV.

## Files

- `index.html` — the frontend
- `api/brief.js` — the serverless function that proxies to Claude (keeps your
  API key off the client)
- `package.json` — tells Vercel this is a Node project

## Notes

- The serverless function rate-limits to 6 briefs per minute per IP. A determined
  visitor could still burn through credits; for serious public deployment add
  Vercel KV or Upstash Redis-backed rate limiting and consider Anthropic's
  prompt caching for the system prompt.
- Cost per brief is roughly £0.005–£0.02 depending on input length.
- See `architecture.docx` (not in this repo — sent separately) for the full
  prompt-engineering rationale.
