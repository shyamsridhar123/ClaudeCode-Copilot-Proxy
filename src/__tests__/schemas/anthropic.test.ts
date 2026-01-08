/**
 * Tests for Anthropic validation schemas
 */

import { 
  anthropicMessageRequestSchema,
  countTokensRequestSchema,
  anthropicMessageSchema,
} from '../../schemas/anthropic.js';

describe('Anthropic Schemas', () => {
  describe('anthropicMessageSchema', () => {
    it('should validate a simple user message', () => {
      const validMessage = {
        role: 'user',
        content: 'Hello, Claude!',
      };
      
      expect(() => anthropicMessageSchema.parse(validMessage)).not.toThrow();
    });

    it('should validate a message with content blocks', () => {
      const validMessage = {
        role: 'user',
        content: [
          { type: 'text', text: 'What is in this image?' },
        ],
      };
      
      expect(() => anthropicMessageSchema.parse(validMessage)).not.toThrow();
    });

    it('should reject invalid role', () => {
      const invalidMessage = {
        role: 'system',
        content: 'Invalid role',
      };
      
      expect(() => anthropicMessageSchema.parse(invalidMessage)).toThrow();
    });

    it('should validate assistant messages', () => {
      const validMessage = {
        role: 'assistant',
        content: 'I can help with that!',
      };
      
      expect(() => anthropicMessageSchema.parse(validMessage)).not.toThrow();
    });
  });

  describe('anthropicMessageRequestSchema', () => {
    const validRequest = {
      model: 'claude-opus-4-5-20250514',
      messages: [
        { role: 'user', content: 'Hello!' },
      ],
      max_tokens: 1024,
    };

    it('should validate a complete valid request', () => {
      expect(() => anthropicMessageRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should validate request with optional fields', () => {
      const requestWithOptionals = {
        ...validRequest,
        system: 'You are a helpful assistant.',
        temperature: 0.7,
        top_p: 0.9,
        stream: false,
      };
      
      expect(() => anthropicMessageRequestSchema.parse(requestWithOptionals)).not.toThrow();
    });

    it('should reject request without model', () => {
      const invalidRequest = {
        messages: [{ role: 'user', content: 'Hello!' }],
        max_tokens: 1024,
      };
      
      expect(() => anthropicMessageRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request without messages', () => {
      const invalidRequest = {
        model: 'claude-opus-4.5',
        max_tokens: 1024,
      };
      
      expect(() => anthropicMessageRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request with empty messages array', () => {
      const invalidRequest = {
        model: 'claude-opus-4.5',
        messages: [],
        max_tokens: 1024,
      };
      
      expect(() => anthropicMessageRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject request without max_tokens', () => {
      const invalidRequest = {
        model: 'claude-opus-4.5',
        messages: [{ role: 'user', content: 'Hello!' }],
      };
      
      expect(() => anthropicMessageRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject negative max_tokens', () => {
      const invalidRequest = {
        ...validRequest,
        max_tokens: -100,
      };
      
      expect(() => anthropicMessageRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should reject temperature outside range', () => {
      const invalidRequest = {
        ...validRequest,
        temperature: 1.5,
      };
      
      expect(() => anthropicMessageRequestSchema.parse(invalidRequest)).toThrow();
    });

    it('should validate with stop_sequences', () => {
      const requestWithStops = {
        ...validRequest,
        stop_sequences: ['STOP', 'END'],
      };
      
      expect(() => anthropicMessageRequestSchema.parse(requestWithStops)).not.toThrow();
    });

    it('should reject too many stop_sequences', () => {
      const invalidRequest = {
        ...validRequest,
        stop_sequences: ['STOP1', 'STOP2', 'STOP3', 'STOP4', 'STOP5'],
      };
      
      expect(() => anthropicMessageRequestSchema.parse(invalidRequest)).toThrow();
    });
  });

  describe('countTokensRequestSchema', () => {
    it('should validate a valid token count request', () => {
      const validRequest = {
        messages: [
          { role: 'user', content: 'Count these tokens' },
        ],
      };
      
      expect(() => countTokensRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should validate with model and system prompt', () => {
      const validRequest = {
        model: 'claude-opus-4.5',
        messages: [
          { role: 'user', content: 'Count these tokens' },
        ],
        system: 'You are a helpful assistant.',
      };
      
      expect(() => countTokensRequestSchema.parse(validRequest)).not.toThrow();
    });

    it('should reject request with empty messages', () => {
      const invalidRequest = {
        messages: [],
      };
      
      expect(() => countTokensRequestSchema.parse(invalidRequest)).toThrow();
    });
  });
});
