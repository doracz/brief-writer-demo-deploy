# Brief Writer — a Claude-powered marketing agent

A working prototype that turns rough campaign ideas into structured creative
briefs. Built as a prompt-engineering portfolio piece.

**Live demo:** [brief-writer-demo-deploy.vercel.app](https://brief-writer-demo-deploy.vercel.app)

## What it does

A stakeholder pastes a rough campaign idea (a fragment, a paragraph, anything
in between). The agent:

- Reasons through five strategic questions in a hidden `<thinking>` block
  before writing anything
- Produces a structured brief conforming to a strict JSON schema
- Refuses off-task requests, asks for clarification on sparse ones, and flags
  regulated topics for compliance review
- Marks unknowable fields as "TO CONFIRM" rather than fabricating budgets,
  dates, or metrics

The JSON schema is the contract between this agent and any downstream agent
(content production, QA, measurement). Keeping it stable is what makes the
brief writer the first node in a workflow rather than a one-off tool.

## How it's built

- **Frontend** (`index.html`): a single-page UI with five example inputs
  covering the full behaviour matrix (happy path, sparse, off-task, regulated,
  ambiguous).
- **Serverless function** (`api/brief.js`): a Vercel function that proxies
  requests to the Claude API. Holds the API key server-side so it's never
  exposed to the browser. Includes basic IP-based rate limiting.
- **The system prompt** is the agent. Five blocks in this order: role and
  audience, reasoning method (chain-of-thought), output contract (JSON schema),
  guardrails, and two few-shot examples.

Model: Claude Sonnet 4.6. Sonnet is well-suited to structured generation tasks
like this; Opus would offer marginal quality gains at significantly higher
cost.

## Run locally

You'll need Node 18+ and an Anthropic API key.

```bash
npm install -g vercel
vercel dev
```

Set your API key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Open http://localhost:3000.

## Files

- `index.html` — the frontend
- `api/brief.js` — the serverless function that proxies to Claude (keeps the
  API key off the client)
- `package.json` — tells Vercel this is a Node project

## Notes

- The serverless function rate-limits to 6 briefs per minute per IP. For
  production deployment, this would move to Vercel KV or Upstash Redis-backed
  rate limiting, with prompt caching on the system prompt to reduce per-call
  cost.
- Cost per brief is roughly £0.005–£0.02 depending on input length.
- Full prompt-engineering rationale (system prompt structure, schema design
  decisions, test approach) is documented separately and available on request.

## About

Built by [Dora Czerna](https://github.com/doracz) as a portfolio piece.
Background in senior product design across regulated industries, with hands-on prompt engineering and earlier finance/ACCA experience.
