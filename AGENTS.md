# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Project Overview

**GitHub Copilot Proxy for Claude Code** - An Anthropic API-compatible proxy server that enables Claude Code to use GitHub Copilot's Anthropic models (Claude Opus 4.5, Claude Sonnet, etc.) instead of direct Anthropic API access.

### Goals

1. **Primary**: Enable Claude Code to leverage GitHub Copilot's Anthropic models (Opus 4.5, Sonnet 4, etc.)
2. **API Compatibility**: Implement Anthropic's Messages API format that Claude Code expects
3. **Model Mapping**: Map Claude model names to GitHub Copilot's Anthropic model endpoints
4. **Seamless Integration**: Handle authentication, token management, and request/response translation

### Architecture

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│   Claude Code   │────▶│   Copilot Proxy Server   │────▶│  GitHub Copilot API │
│  (Anthropic API │     │                          │     │  (Anthropic Models) │
│     format)     │     │  - Auth (OAuth device)   │     │  - claude-opus-4.5  │
└─────────────────┘     │  - Request translation   │     │  - claude-sonnet-4  │
                        │  - Response translation  │     │  - etc.             │
                        │  - Streaming support     │     └─────────────────────┘
                        └──────────────────────────┘
```

### Key Components

| Component | Purpose | Status |
|-----------|---------|--------|
| `/v1/messages` | Anthropic Messages API endpoint | 🔴 TODO |
| `/v1/models` | List available Claude models | 🔴 TODO |
| `anthropic-service.ts` | Translate Anthropic ↔ Copilot formats | 🔴 TODO |
| `auth-service.ts` | GitHub OAuth device flow (existing) | ✅ Existing |
| `copilot-service.ts` | Copilot API integration (existing) | ✅ Existing |

### API Mappings

**Anthropic Messages API → GitHub Copilot:**

| Anthropic Field | Copilot Equivalent |
|-----------------|-------------------|
| `model` (e.g., `claude-opus-4-5-20250514`) | Map to Copilot's `claude-opus-4.5` |
| `messages` array | Convert to Copilot prompt format |
| `max_tokens` | `max_tokens` |
| `temperature` | `temperature` |
| `stream` | `stream` |
| `system` | Prepend to prompt |

### Configuration for Claude Code

1. Start the proxy server: `npm start`
2. In Claude Code settings, set:
   - **API Base URL**: `http://localhost:3000`
   - **API Key**: (handled by GitHub OAuth)
3. Authenticate via `http://localhost:3000/auth.html`

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Development Workflow

### Running the Server

```bash
npm install           # Install dependencies
npm run build         # Build TypeScript
npm run dev           # Development mode with hot reload
npm start             # Production mode
```

### Testing

```bash
npm test              # Run tests
npm run lint          # Lint code
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

