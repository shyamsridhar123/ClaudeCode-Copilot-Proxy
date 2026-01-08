/**
 * Validation schemas for Anthropic API requests
 * Using Zod for runtime type validation
 */

import { z } from 'zod';

/**
 * Content block schemas
 */
export const textBlockSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
});

export const imageBlockSchema = z.object({
  type: z.literal('image'),
  source: z.object({
    type: z.enum(['base64', 'url']),
    media_type: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']).optional(),
    data: z.string().optional(),
    url: z.string().url().optional(),
  }),
});

export const contentBlockSchema = z.union([
  textBlockSchema,
  imageBlockSchema,
]);

/**
 * Message schema
 */
export const anthropicMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.union([
    z.string(),
    z.array(contentBlockSchema),
  ]),
});

/**
 * Tool definition schema
 */
export const anthropicToolSchema = z.object({
  name: z.string().min(1).max(64),
  description: z.string().optional(),
  input_schema: z.object({
    type: z.literal('object'),
    properties: z.record(z.unknown()),
    required: z.array(z.string()).optional(),
  }),
});

/**
 * Main request schema for POST /v1/messages
 */
export const anthropicMessageRequestSchema = z.object({
  model: z.string().min(1, 'Model is required'),
  messages: z.array(anthropicMessageSchema).min(1, 'At least one message is required'),
  max_tokens: z.number().int().positive('max_tokens must be a positive integer'),
  system: z.string().optional(),
  temperature: z.number().min(0).max(1).optional(),
  top_p: z.number().min(0).max(1).optional(),
  top_k: z.number().int().positive().optional(),
  stop_sequences: z.array(z.string()).max(4).optional(),
  stream: z.boolean().optional(),
  tools: z.array(anthropicToolSchema).optional(),
  tool_choice: z.union([
    z.enum(['auto', 'any', 'none']),
    z.object({
      type: z.literal('tool'),
      name: z.string(),
    }),
  ]).optional(),
  metadata: z.object({
    user_id: z.string().optional(),
  }).optional(),
});

/**
 * Token count request schema
 */
export const countTokensRequestSchema = z.object({
  model: z.string().optional(),
  messages: z.array(anthropicMessageSchema).min(1),
  system: z.string().optional(),
});

/**
 * Type exports for use in routes
 */
export type AnthropicMessageRequestSchema = z.infer<typeof anthropicMessageRequestSchema>;
export type CountTokensRequestSchema = z.infer<typeof countTokensRequestSchema>;
