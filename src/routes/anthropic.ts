/**
 * Anthropic API Routes - Claude Code compatible endpoints
 * 
 * Implements Anthropic Messages API format for Claude Code integration
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { 
  isTokenValid, 
  getCopilotToken,
  refreshCopilotToken 
} from '../services/auth-service.js';
import { 
  makeAnthropicCompletionRequest,
  createAnthropicError,
  generateMessageId,
} from '../services/anthropic-service.js';
import { getAvailableModels, mapClaudeModelToCopilot } from '../utils/model-mapper.js';
import { 
  AnthropicMessageRequest,
  MessageStartEvent,
  ContentBlockStartEvent,
  ContentBlockDeltaEvent,
  ContentBlockStopEvent,
  MessageDeltaEvent,
  MessageStopEvent,
} from '../types/anthropic.js';
import { logger } from '../utils/logger.js';
import { trackRequest } from '../services/usage-service.js';

export const anthropicRoutes = express.Router();

// Authentication middleware for Anthropic endpoints
const requireAuth = async (
  _req: express.Request, 
  res: express.Response, 
  next: express.NextFunction
) => {
  
  // We accept requests with or without API key, but require GitHub Copilot auth
  if (!isTokenValid()) {
    const error = createAnthropicError(
      'authentication_error',
      'GitHub Copilot authentication required. Please authenticate at /auth.html'
    );
    return res.status(401).json(error);
  }

  try {
    // Check if token needs refreshing
    if (getCopilotToken() && !isTokenValid()) {
      await refreshCopilotToken();
    }
    next();
  } catch (error) {
    logger.error('Token refresh failed in Anthropic middleware:', error);
    const authError = createAnthropicError(
      'authentication_error',
      'GitHub Copilot authentication failed. Please re-authenticate.'
    );
    return res.status(401).json(authError);
  }
};

// GET /v1/models - List available Claude models
anthropicRoutes.get('/models', requireAuth, (_req, res) => {
  const models = getAvailableModels();
  res.json(models);
});

// POST /v1/messages - Create a message (main chat endpoint)
anthropicRoutes.post('/messages', requireAuth, async (req, res, _next) => {
  const sessionId = res.locals.sessionId || uuidv4();
  
  try {
    const request = req.body as AnthropicMessageRequest;
    const { messages, model, max_tokens, stream = false } = request;
    
    // Validate required fields
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      const error = createAnthropicError(
        'invalid_request_error',
        'messages: field required'
      );
      return res.status(400).json(error);
    }
    
    if (!model) {
      const error = createAnthropicError(
        'invalid_request_error',
        'model: field required'
      );
      return res.status(400).json(error);
    }
    
    if (!max_tokens || typeof max_tokens !== 'number') {
      const error = createAnthropicError(
        'invalid_request_error',
        'max_tokens: field required and must be a number'
      );
      return res.status(400).json(error);
    }
    
    // Validate message format
    for (const msg of messages) {
      if (!msg.role || !['user', 'assistant'].includes(msg.role)) {
        const error = createAnthropicError(
          'invalid_request_error',
          'messages: each message must have a valid role (user or assistant)'
        );
        return res.status(400).json(error);
      }
      if (msg.content === undefined || msg.content === null) {
        const error = createAnthropicError(
          'invalid_request_error',
          'messages: each message must have content'
        );
        return res.status(400).json(error);
      }
    }
    
    const copilotToken = getCopilotToken();
    if (!copilotToken) {
      const error = createAnthropicError(
        'authentication_error',
        'GitHub Copilot token not available'
      );
      return res.status(401).json(error);
    }
    
    // Track request
    trackRequest(sessionId, 0);
    
    // Handle streaming vs non-streaming
    if (stream) {
      await handleAnthropicStreaming(req, res, request, copilotToken.token, sessionId);
    } else {
      // Non-streaming response
      try {
        const response = await makeAnthropicCompletionRequest(request, copilotToken.token);
        
        // Track token usage
        if (response.usage) {
          trackRequest(sessionId, response.usage.input_tokens + response.usage.output_tokens);
        }
        
        res.json(response);
      } catch (error) {
        logger.error('Error in Anthropic completion:', error);
        const apiError = createAnthropicError(
          'api_error',
          error instanceof Error ? error.message : 'Internal server error'
        );
        return res.status(500).json(apiError);
      }
    }
  } catch (error) {
    logger.error('Error processing Anthropic request:', error);
    const apiError = createAnthropicError(
      'api_error',
      error instanceof Error ? error.message : 'Internal server error'
    );
    return res.status(500).json(apiError);
  }
});

/**
 * Handle streaming response in Anthropic SSE format
 */
async function handleAnthropicStreaming(
  req: express.Request,
  res: express.Response,
  request: AnthropicMessageRequest,
  copilotToken: string,
  sessionId: string
): Promise<void> {
  const { model } = request;
  const messageId = generateMessageId();
  // Model mapping is handled in makeAnthropicCompletionRequest
  void mapClaudeModelToCopilot(model); // Validate model
  
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  
  let outputTokens = 0;
  
  try {
    // Send message_start event
    const messageStart: MessageStartEvent = {
      type: 'message_start',
      message: {
        id: messageId,
        type: 'message',
        role: 'assistant',
        content: [],
        model: model,
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 0,
          output_tokens: 0,
        },
      },
    };
    res.write(`event: message_start\ndata: ${JSON.stringify(messageStart)}\n\n`);
    
    // Send content_block_start event
    const contentBlockStart: ContentBlockStartEvent = {
      type: 'content_block_start',
      index: 0,
      content_block: {
        type: 'text',
        text: '',
      },
    };
    res.write(`event: content_block_start\ndata: ${JSON.stringify(contentBlockStart)}\n\n`);
    
    // Make the actual request to Copilot
    // For now, we'll make a non-streaming request and simulate streaming
    // A full implementation would use Copilot's streaming endpoint
    const response = await makeAnthropicCompletionRequest(
      { ...request, stream: false },
      copilotToken
    );
    
    // Extract text from response
    const text = response.content
      .filter((block): block is { type: 'text'; text: string } => block.type === 'text')
      .map((block) => block.text)
      .join('');
    
    // Simulate streaming by sending text in chunks
    const chunkSize = 20; // Characters per chunk
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize);
      
      const contentDelta: ContentBlockDeltaEvent = {
        type: 'content_block_delta',
        index: 0,
        delta: {
          type: 'text_delta',
          text: chunk,
        },
      };
      res.write(`event: content_block_delta\ndata: ${JSON.stringify(contentDelta)}\n\n`);
      
      outputTokens += Math.ceil(chunk.length / 4); // Rough token estimate
      
      // Small delay to simulate streaming (optional, can be removed for speed)
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    
    // Send content_block_stop event
    const contentBlockStop: ContentBlockStopEvent = {
      type: 'content_block_stop',
      index: 0,
    };
    res.write(`event: content_block_stop\ndata: ${JSON.stringify(contentBlockStop)}\n\n`);
    
    // Send message_delta event with stop_reason
    const messageDelta: MessageDeltaEvent = {
      type: 'message_delta',
      delta: {
        stop_reason: response.stop_reason || 'end_turn',
        stop_sequence: response.stop_sequence,
      },
      usage: {
        output_tokens: response.usage?.output_tokens || outputTokens,
      },
    };
    res.write(`event: message_delta\ndata: ${JSON.stringify(messageDelta)}\n\n`);
    
    // Send message_stop event
    const messageStop: MessageStopEvent = {
      type: 'message_stop',
    };
    res.write(`event: message_stop\ndata: ${JSON.stringify(messageStop)}\n\n`);
    
    // Track usage
    if (response.usage) {
      trackRequest(sessionId, response.usage.input_tokens + response.usage.output_tokens);
    }
    
    res.end();
  } catch (error) {
    logger.error('Error in Anthropic streaming:', error);
    
    // Send error event
    const errorEvent = {
      type: 'error',
      error: {
        type: 'api_error',
        message: error instanceof Error ? error.message : 'Streaming error',
      },
    };
    res.write(`event: error\ndata: ${JSON.stringify(errorEvent)}\n\n`);
    res.end();
  }
}
