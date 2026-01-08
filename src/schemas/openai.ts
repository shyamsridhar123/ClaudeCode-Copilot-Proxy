/**
 * Validation schemas for OpenAI API requests
 * Using Zod for runtime type validation
 */

import { z } from 'zod';

/**
 * OpenAI message schema
 */
export const openAIMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'function']),
  content: z.string().nullable(),
  name: z.string().optional(),
  function_call: z.object({
    name: z.string(),
    arguments: z.string(),
  }).optional(),
});

/**
 * OpenAI function schema
 */
export const openAIFunctionSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().optional(),
  parameters: z.record(z.unknown()).optional(),
});

/**
 * Main request schema for POST /v1/chat/completions
 */
export const openAICompletionRequestSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  messages: z.array(openAIMessageSchema).min(1, 'At least one message is required'),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  n: z.number().int().positive().optional(),
  stream: z.boolean().optional(),
  stop: z.union([z.string(), z.array(z.string())]).optional(),
  max_tokens: z.number().int().positive().optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  logit_bias: z.record(z.number()).optional(),
  user: z.string().optional(),
  functions: z.array(openAIFunctionSchema).optional(),
  function_call: z.union([
    z.enum(['auto', 'none']),
    z.object({ name: z.string() }),
  ]).optional(),
});

/**
 * Type exports for use in routes
 */
export type OpenAICompletionRequestSchema = z.infer<typeof openAICompletionRequestSchema>;
