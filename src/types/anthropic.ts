/**
 * Anthropic API Types for Claude Code Compatibility
 * Based on Anthropic Messages API specification
 */

// ============================================================================
// Content Block Types
// ============================================================================

/**
 * Text content block in a message
 */
export interface TextBlock {
  type: 'text';
  text: string;
}

/**
 * Image content block (base64 or URL)
 */
export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64' | 'url';
    media_type?: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data?: string;  // base64 encoded image data
    url?: string;   // URL to image
  };
}

/**
 * Tool use block - when Claude wants to use a tool
 */
export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

/**
 * Tool result block - result from a tool execution
 */
export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string | ContentBlock[];
  is_error?: boolean;
}

/**
 * Union type for all content block types
 */
export type ContentBlock = TextBlock | ImageBlock | ToolUseBlock | ToolResultBlock;

// ============================================================================
// Message Types
// ============================================================================

/**
 * A message in the conversation
 */
export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

/**
 * Tool definition for function calling
 */
export interface AnthropicTool {
  name: string;
  description?: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

// ============================================================================
// Request Types
// ============================================================================

/**
 * Request body for POST /v1/messages
 */
export interface AnthropicMessageRequest {
  /** The model to use (e.g., claude-opus-4-5-20250514) */
  model: string;
  
  /** Array of messages in the conversation */
  messages: AnthropicMessage[];
  
  /** Maximum tokens to generate */
  max_tokens: number;
  
  /** System prompt (optional) */
  system?: string;
  
  /** Sampling temperature (0-1) */
  temperature?: number;
  
  /** Top-p sampling */
  top_p?: number;
  
  /** Top-k sampling */
  top_k?: number;
  
  /** Stop sequences */
  stop_sequences?: string[];
  
  /** Whether to stream the response */
  stream?: boolean;
  
  /** Tools available for the model to use */
  tools?: AnthropicTool[];
  
  /** How to handle tool use */
  tool_choice?: 'auto' | 'any' | 'none' | { type: 'tool'; name: string };
  
  /** Metadata for the request */
  metadata?: {
    user_id?: string;
  };
}

// ============================================================================
// Response Types
// ============================================================================

/**
 * Usage statistics for the request
 */
export interface AnthropicUsage {
  input_tokens: number;
  output_tokens: number;
}

/**
 * Response from POST /v1/messages (non-streaming)
 */
export interface AnthropicMessageResponse {
  /** Unique message ID */
  id: string;
  
  /** Always "message" */
  type: 'message';
  
  /** Role is always "assistant" for responses */
  role: 'assistant';
  
  /** Content blocks in the response */
  content: ContentBlock[];
  
  /** The model that generated the response */
  model: string;
  
  /** Reason the model stopped generating */
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  
  /** Stop sequence that was hit, if any */
  stop_sequence: string | null;
  
  /** Token usage statistics */
  usage: AnthropicUsage;
}

// ============================================================================
// Streaming Event Types
// ============================================================================

/**
 * Message start event - first event in a stream
 */
export interface MessageStartEvent {
  type: 'message_start';
  message: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: [];
    model: string;
    stop_reason: null;
    stop_sequence: null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

/**
 * Content block start event
 */
export interface ContentBlockStartEvent {
  type: 'content_block_start';
  index: number;
  content_block: {
    type: 'text';
    text: '';
  } | {
    type: 'tool_use';
    id: string;
    name: string;
    input: Record<string, never>;
  };
}

/**
 * Content block delta event - incremental text updates
 */
export interface ContentBlockDeltaEvent {
  type: 'content_block_delta';
  index: number;
  delta: {
    type: 'text_delta';
    text: string;
  } | {
    type: 'input_json_delta';
    partial_json: string;
  };
}

/**
 * Content block stop event
 */
export interface ContentBlockStopEvent {
  type: 'content_block_stop';
  index: number;
}

/**
 * Message delta event - updates to message metadata
 */
export interface MessageDeltaEvent {
  type: 'message_delta';
  delta: {
    stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use';
    stop_sequence: string | null;
  };
  usage: {
    output_tokens: number;
  };
}

/**
 * Message stop event - final event in a stream
 */
export interface MessageStopEvent {
  type: 'message_stop';
}

/**
 * Ping event - keep-alive
 */
export interface PingEvent {
  type: 'ping';
}

/**
 * Error event in stream
 */
export interface StreamErrorEvent {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Union type for all streaming events
 */
export type AnthropicStreamEvent =
  | MessageStartEvent
  | ContentBlockStartEvent
  | ContentBlockDeltaEvent
  | ContentBlockStopEvent
  | MessageDeltaEvent
  | MessageStopEvent
  | PingEvent
  | StreamErrorEvent;

// ============================================================================
// Error Types
// ============================================================================

/**
 * Anthropic API error response
 */
export interface AnthropicError {
  type: 'error';
  error: {
    type: 'invalid_request_error' | 'authentication_error' | 'permission_error' | 
          'not_found_error' | 'rate_limit_error' | 'api_error' | 'overloaded_error';
    message: string;
  };
}

// ============================================================================
// Model Types
// ============================================================================

/**
 * Model information for /v1/models endpoint
 */
export interface AnthropicModel {
  id: string;
  object: 'model';
  created: number;
  owned_by: string;
  display_name?: string;
}

/**
 * Response from /v1/models endpoint
 */
export interface AnthropicModelList {
  object: 'list';
  data: AnthropicModel[];
}
