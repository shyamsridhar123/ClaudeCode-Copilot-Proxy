import dotenv from 'dotenv';
import { z } from 'zod';
// @ts-expect-error - ts-jest doesn't support import attributes yet
import pkg from '../../package.json';

// Load environment variables
dotenv.config();

// Schema for env validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3000'),
  HOST: z.string().default('localhost'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  GITHUB_COPILOT_CLIENT_ID: z.string().default('Iv1.b507a08c87ecfe98'),
  // Rate limiting settings (requests per minute)
  RATE_LIMIT_DEFAULT: z.string().default('60'),
  RATE_LIMIT_CHAT_COMPLETIONS: z.string().default('20'),
});

// Parse and validate environment variables
const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  LOG_LEVEL: process.env.LOG_LEVEL,
  GITHUB_COPILOT_CLIENT_ID: process.env.GITHUB_COPILOT_CLIENT_ID,
  RATE_LIMIT_DEFAULT: process.env.RATE_LIMIT_DEFAULT,
  RATE_LIMIT_CHAT_COMPLETIONS: process.env.RATE_LIMIT_CHAT_COMPLETIONS,
});

// API endpoints for OpenAI-compatible Copilot API
const API_ENDPOINTS = {
  GITHUB_COPILOT_TOKEN: 'https://api.github.com/copilot_internal/v2/token',
  GITHUB_COPILOT_COMPLETIONS: 'https://copilot-proxy.githubusercontent.com/v1/engines/copilot-codex/completions',
};

// API endpoints for Anthropic-compatible Copilot API (Claude models)
const ANTHROPIC_API_ENDPOINTS = {
  // GitHub Copilot's chat completions endpoint (OpenAI-compatible, supports Claude models)
  COPILOT_ANTHROPIC_CHAT: 'https://api.githubcopilot.com/chat/completions',
};

// Claude model mappings: Claude Code model names -> Copilot model names
export const CLAUDE_MODEL_MAPPINGS: Record<string, string> = {
  // Claude Opus 4.5 (default - latest flagship)
  'claude-opus-4-5-20250514': 'claude-opus-4.5',
  'claude-opus-4.5': 'claude-opus-4.5',
  'opus': 'claude-opus-4.5',
  
  // Claude Sonnet 4.5
  'claude-sonnet-4-5-20250514': 'claude-sonnet-4.5',
  'claude-sonnet-4.5': 'claude-sonnet-4.5',
  'claude-sonnet-4-20250514': 'claude-sonnet-4.5',
  'claude-sonnet-4': 'claude-sonnet-4.5',
  'sonnet': 'claude-sonnet-4.5',
  
  // Claude Haiku 4.5
  'claude-haiku-4-5-20250514': 'claude-haiku-4.5',
  'claude-haiku-4.5': 'claude-haiku-4.5',
  'claude-3-5-haiku-20241022': 'claude-haiku-4.5',
  'claude-3.5-haiku': 'claude-haiku-4.5',
  'haiku': 'claude-haiku-4.5',
};

// Available Claude models via Copilot (Opus 4.5 is default)
export const AVAILABLE_CLAUDE_MODELS = [
  {
    id: 'claude-opus-4-5-20250514',
    display_name: 'Claude Opus 4.5 (Default)',
    copilot_model: 'claude-opus-4.5',
  },
  {
    id: 'claude-sonnet-4-5-20250514',
    display_name: 'Claude Sonnet 4.5',
    copilot_model: 'claude-sonnet-4.5',
  },
  {
    id: 'claude-haiku-4-5-20250514',
    display_name: 'Claude Haiku 4.5',
    copilot_model: 'claude-haiku-4.5',
  },
];

// Configuration object
export const config = {
  version: pkg.version,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  server: {
    port: parseInt(env.PORT, 10),
    host: env.HOST,
  },
  logging: {
    level: env.LOG_LEVEL,
  },
  github: {
    copilot: {
      clientId: env.GITHUB_COPILOT_CLIENT_ID,
      apiEndpoints: API_ENDPOINTS,
      anthropicEndpoints: ANTHROPIC_API_ENDPOINTS,
    }
  },
  rateLimits: {
    default: parseInt(env.RATE_LIMIT_DEFAULT, 10),
    chatCompletions: parseInt(env.RATE_LIMIT_CHAT_COMPLETIONS, 10),
    // Token usage thresholds
    maxTokensPerRequest: 4000,
    maxTokensPerMinute: 20000,
    tokenRateLimitResetTime: 60 * 1000, // 1 minute in ms
  }
};
