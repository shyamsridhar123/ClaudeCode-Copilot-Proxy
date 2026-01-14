/**
 * Anthropic Service - Translation layer between Claude Code and GitHub Copilot
 * 
 * Handles conversion of Anthropic Messages API format to/from Copilot format
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/index.js';
import {
  AnthropicMessage,
  AnthropicMessageRequest,
  AnthropicMessageResponse,
  ContentBlock,
  TextBlock,
  AnthropicUsage,
  AnthropicError,
} from '../types/anthropic.js';
import { CopilotCompletionResponse } from '../types/github.js';
import { mapClaudeModelToCopilot } from '../utils/model-mapper.js';
import { getMachineId } from '../utils/machine-id.js';
import { logger } from '../utils/logger.js';

/**
 * Convert Anthropic messages to a single prompt string for Copilot
 * 
 * @param messages - Array of Anthropic messages
 * @param systemPrompt - Optional system prompt
 * @returns Formatted prompt string
 */
export function convertAnthropicMessagesToCopilotPrompt(
  messages: AnthropicMessage[],
  systemPrompt?: string
): string {
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return systemPrompt ? systemPrompt + '\n\n' : '';
  }

  let prompt = '';

  // Add system prompt at the beginning if provided
  if (systemPrompt) {
    prompt += systemPrompt + '\n\n';
  }

  // Process each message
  for (const message of messages) {
    const role = message.role === 'user' ? 'Human' : 'Assistant';
    const content = extractTextContent(message.content);

    if (content) {
      prompt += `${role}: ${content}\n\n`;
    }
  }

  // If the last message was from the user, prompt for assistant response
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
    prompt += 'Assistant: ';
  }

  return prompt;
}

/**
 * Extract text content from Anthropic content (string or content blocks)
 * 
 * @param content - String or array of content blocks
 * @returns Plain text content
 */
export function extractTextContent(content: string | ContentBlock[]): string {
  if (typeof content === 'string') {
    return content;
  }

  if (!Array.isArray(content)) {
    return '';
  }

  // Extract text from all text blocks
  return content
    .filter((block): block is TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
}

/**
 * Convert Copilot response to Anthropic message response format
 * 
 * @param copilotResponse - Response from Copilot API
 * @param model - The model that was requested
 * @returns Anthropic-formatted message response
 */
export function convertCopilotToAnthropicResponse(
  copilotResponse: CopilotCompletionResponse,
  model: string
): AnthropicMessageResponse {
  // Extract text from Copilot response
  const text = copilotResponse.choices
    .map((choice) => choice.text)
    .join('');

  // Build content blocks
  const content: ContentBlock[] = [];
  if (text) {
    content.push({
      type: 'text',
      text: text.trim(),
    });
  }

  // Calculate usage
  const usage: AnthropicUsage = {
    input_tokens: copilotResponse.usage?.prompt_tokens || 0,
    output_tokens: copilotResponse.usage?.completion_tokens || 0,
  };

  // Determine stop reason
  let stopReason: AnthropicMessageResponse['stop_reason'] = 'end_turn';
  const finishReason = copilotResponse.choices[0]?.finish_reason;
  if (finishReason === 'length') {
    stopReason = 'max_tokens';
  } else if (finishReason === 'stop') {
    stopReason = 'stop_sequence';
  }

  return {
    id: `msg_${copilotResponse.id || uuidv4()}`,
    type: 'message',
    role: 'assistant',
    content,
    model,
    stop_reason: stopReason,
    stop_sequence: null,
    usage,
  };
}

/**
 * Make a completion request to GitHub Copilot using Anthropic format
 * 
 * @param request - Anthropic message request
 * @param copilotToken - Copilot authentication token
 * @returns Anthropic-formatted message response
 */
export async function makeAnthropicCompletionRequest(
  request: AnthropicMessageRequest,
  copilotToken: string
): Promise<AnthropicMessageResponse> {
  const { messages, system, temperature, max_tokens, model } = request;

  // Map the model name to Copilot's model name
  const copilotModel = mapClaudeModelToCopilot(model);

  logger.info(`Model mapping: "${model}" -> "${copilotModel}"`);

  // Get machine ID
  const machineId = getMachineId();

  // Use Copilot's chat completions endpoint (OpenAI-compatible)
  const chatEndpoint = config.github.copilot.anthropicEndpoints.COPILOT_ANTHROPIC_CHAT;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${copilotToken}`,
    'X-Request-Id': uuidv4(),
    'Machine-Id': machineId,
    'User-Agent': 'GitHubCopilotChat/0.12.0',
    'Editor-Version': 'vscode/1.90.0',
    'Editor-Plugin-Version': 'copilot-chat/0.12.0',
    'Openai-Organization': 'github-copilot',
    'Openai-Intent': 'conversation-agent',
  };

  // Build OpenAI-compatible request body
  // Prepend system message if provided
  const openaiMessages: Array<{ role: string; content: string }> = [];

  if (system) {
    openaiMessages.push({
      role: 'system',
      content: system,
    });
  }

  // Convert Anthropic messages to OpenAI format
  for (const msg of messages) {
    openaiMessages.push({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: typeof msg.content === 'string' ? msg.content : extractTextContent(msg.content),
    });
  }

  const body = {
    model: copilotModel,
    messages: openaiMessages,
    max_tokens: max_tokens || 4096,
    temperature: temperature ?? 0.7,
    stream: false,
  };

  try {
    logger.debug('Making chat completion request to Copilot', {
      endpoint: chatEndpoint,
      model: copilotModel,
    });

    const response = await fetch(chatEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Copilot chat API error', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(`Copilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as Record<string, unknown>;

    // Convert OpenAI chat response to Anthropic format
    return convertOpenAIToAnthropicResponse(data, model);
  } catch (error) {
    logger.error('Error making chat completion request', { error });
    throw error;
  }
}

/**
 * Convert OpenAI chat completion response to Anthropic format
 */
function convertOpenAIToAnthropicResponse(
  data: Record<string, unknown>,
  model: string
): AnthropicMessageResponse {
  const choices = (data.choices as Array<{ message?: { content?: string }; finish_reason?: string }>) || [];
  const firstChoice = choices[0] || {};
  const message = firstChoice.message || {};
  const content = (message.content as string) || '';
  const usage = (data.usage as { prompt_tokens?: number; completion_tokens?: number }) || {};

  return {
    id: `msg_${uuidv4().replace(/-/g, '').substring(0, 24)}`,
    type: 'message',
    role: 'assistant',
    content: [{ type: 'text', text: content }],
    model,
    stop_reason: firstChoice.finish_reason === 'stop' ? 'end_turn' : (firstChoice.finish_reason as 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null) || 'end_turn',
    stop_sequence: null,
    usage: {
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
    },
  };
}

/**
 * Create an Anthropic error response
 * 
 * @param type - Error type
 * @param message - Error message
 * @returns Anthropic error object
 */
export function createAnthropicError(
  type: AnthropicError['error']['type'],
  message: string
): AnthropicError {
  return {
    type: 'error',
    error: {
      type,
      message,
    },
  };
}

/**
 * Generate a unique message ID
 * 
 * @returns Message ID in Anthropic format
 */
export function generateMessageId(): string {
  return `msg_${uuidv4().replace(/-/g, '').substring(0, 24)}`;
}
