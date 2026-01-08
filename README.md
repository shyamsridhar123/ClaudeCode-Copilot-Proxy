# GitHub Copilot Proxy for Claude Code & Cursor IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18.0+-green.svg)](https://nodejs.org/)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

> ⚠️ **Disclaimer**: This project is for **educational purposes only**. It is intended to demonstrate API proxy patterns and OAuth device flow authentication. Use at your own risk and ensure compliance with GitHub Copilot's Terms of Service.

A proxy server that enables **Claude Code** and **Cursor IDE** to use GitHub Copilot's AI models instead of direct API access. Use your GitHub Copilot subscription to access Claude models (Opus 4.5, Sonnet 4.5, Haiku 4.5) in Claude Code, or GPT models in Cursor IDE.

## 🚀 Features

- **Anthropic API Compatibility**: Implements the Anthropic Messages API for Claude Code
- **OpenAI API Compatibility**: Implements the OpenAI API format for Cursor IDE
- **Claude Model Support**: Access Claude Opus 4.5, Sonnet 4.5, and Haiku 4.5 via Copilot
- **GitHub Copilot Integration**: Connects to GitHub Copilot's backend services
- **Seamless Authentication**: Handles GitHub OAuth device flow authentication
- **Token Management**: Automatically refreshes Copilot tokens
- **Streaming Support**: Supports both streaming and non-streaming completions
- **Easy Configuration**: Simple setup with Claude Code or Cursor IDE

## 📋 Prerequisites

- Node.js 18.0 or higher
- GitHub Copilot subscription (with access to Claude models)
- Claude Code or Cursor IDE

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shyamsridhar123/ClaudeCode-Copilot-Proxy.git
   cd ClaudeCode-Copilot-Proxy
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```bash
   cp .env.example .env
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Start the proxy server:
   ```bash
   npm start
   ```

## 🤖 Configuration with Claude Code

1. Start the proxy server:
   ```bash
   npm start
   ```
   You should see the authentication portal at http://localhost:3000

2. Complete GitHub authentication by pasting your auth code in the browser

3. Enter `claude` in your terminal to start Claude Code

4. Configure Claude Code to use the proxy:
   ```bash
   claude config set api_base_url http://localhost:3000
   ```

5. Press `Ctrl+C` twice to quit Claude

6. Enter `claude` again to restart with the new configuration

### How to Verify It's Working

✅ **Server logs show 200 responses**: Look for `POST /v1/messages - 200` in the server output

✅ **Token usage is tracked**: You'll see `Tracked request for session ... +XX tokens`

✅ **Model being used**: Shows `"model": "claude-opus-4.5"` or `"claude-sonnet-4.5"`

✅ **Claude Code gets responses**: Your commands should complete without errors

✅ **Usage stats**: Check http://localhost:3000/usage.html in your browser to see how many tokens you've used

### Supported Claude Models

| Model | Copilot Model |
|-------|---------------|
| `claude-opus-4-5-20250514` | Claude Opus 4.5 |
| `claude-sonnet-4-5-20250514` | Claude Sonnet 4.5 |
| `claude-haiku-4-5-20250514` | Claude Haiku 4.5 |

## 🔌 Configuration with Cursor IDE

1. Open Cursor IDE
2. Go to Settings > API Keys
3. In the "Override OpenAI Base URL" section, enter:
   ```
   http://localhost:3000
   ```
4. Go to http://localhost:3000 in your browser
5. Follow the authentication steps to connect to GitHub

## 💡 Usage

Once configured, you can use Cursor IDE as normal. All AI-powered features will now use your GitHub Copilot subscription instead of Cursor's API.

To switch back to Cursor's API:
1. Go to Settings > API Keys
2. Remove the Override OpenAI Base URL

## 🤔 How It Works

### For Claude Code (Anthropic API)

```
┌─────────────────┐     ┌──────────────────────────┐     ┌─────────────────────┐
│   Claude Code   │────▶│   Copilot Proxy Server   │────▶│  GitHub Copilot API │
│  (Anthropic API │     │                          │     │  (Anthropic Models) │
│     format)     │     │  - Auth (OAuth device)   │     │  - claude-opus-4.5   │
└─────────────────┘     │  - Request translation   │     │  - claude-sonnet-4.5 │
                        │  - Response translation  │     │  - claude-haiku-4.5  │
                        │  - Streaming support     │     └─────────────────────┘
                        └──────────────────────────┘
```

1. The proxy authenticates with GitHub using the OAuth device flow
2. GitHub provides a token that the proxy uses to obtain a Copilot token
3. Claude Code sends requests to the proxy in Anthropic format (`/v1/messages`)
4. The proxy forwards requests to GitHub Copilot's Anthropic model endpoints
5. Responses are returned in Anthropic format with streaming support

### For Cursor IDE (OpenAI API)

1. The proxy authenticates with GitHub using the OAuth device flow
2. GitHub provides a token that the proxy uses to obtain a Copilot token
3. Cursor sends requests to the proxy in OpenAI format
4. The proxy converts these requests to GitHub Copilot's format
5. The proxy forwards responses back to Cursor in OpenAI format

## 🛠️ Development

### Running in development mode:
```bash
npm run dev
```

### Testing:
```bash
npm test
```

### Linting:
```bash
npm run lint
```

## 📄 License

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

See the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
