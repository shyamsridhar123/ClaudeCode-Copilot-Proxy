/**
 * Tests for model mapper utility
 */

import { 
  mapClaudeModelToCopilot,
  isValidClaudeModel,
  getAvailableModels,
  getModelDisplayName,
} from '../../utils/model-mapper.js';

describe('Model Mapper', () => {
  describe('mapClaudeModelToCopilot', () => {
    it('should map claude-opus-4-5-20250514 to claude-opus-4.5', () => {
      expect(mapClaudeModelToCopilot('claude-opus-4-5-20250514')).toBe('claude-opus-4.5');
    });

    it('should map claude-sonnet-4-5-20250514 to claude-sonnet-4.5', () => {
      expect(mapClaudeModelToCopilot('claude-sonnet-4-5-20250514')).toBe('claude-sonnet-4.5');
    });

    it('should map claude-haiku-4-5-20250514 to claude-haiku-4.5', () => {
      expect(mapClaudeModelToCopilot('claude-haiku-4-5-20250514')).toBe('claude-haiku-4.5');
    });

    it('should map shorthand "opus" to claude-opus-4.5', () => {
      expect(mapClaudeModelToCopilot('opus')).toBe('claude-opus-4.5');
    });

    it('should map shorthand "sonnet" to claude-sonnet-4.5', () => {
      expect(mapClaudeModelToCopilot('sonnet')).toBe('claude-sonnet-4.5');
    });

    it('should map shorthand "haiku" to claude-haiku-4.5', () => {
      expect(mapClaudeModelToCopilot('haiku')).toBe('claude-haiku-4.5');
    });

    it('should default unknown models to claude-opus-4.5', () => {
      expect(mapClaudeModelToCopilot('unknown-model')).toBe('claude-opus-4.5');
    });

    it('should handle already-mapped model names', () => {
      expect(mapClaudeModelToCopilot('claude-opus-4.5')).toBe('claude-opus-4.5');
      expect(mapClaudeModelToCopilot('claude-sonnet-4.5')).toBe('claude-sonnet-4.5');
      expect(mapClaudeModelToCopilot('claude-haiku-4.5')).toBe('claude-haiku-4.5');
    });
  });

  describe('isValidClaudeModel', () => {
    it('should return true for valid Claude model names', () => {
      expect(isValidClaudeModel('claude-opus-4-5-20250514')).toBe(true);
      expect(isValidClaudeModel('claude-sonnet-4-5-20250514')).toBe(true);
      expect(isValidClaudeModel('claude-haiku-4-5-20250514')).toBe(true);
    });

    it('should return true for shorthand names', () => {
      expect(isValidClaudeModel('opus')).toBe(true);
      expect(isValidClaudeModel('sonnet')).toBe(true);
      expect(isValidClaudeModel('haiku')).toBe(true);
    });

    it('should return true for Copilot model names', () => {
      expect(isValidClaudeModel('claude-opus-4.5')).toBe(true);
      expect(isValidClaudeModel('claude-sonnet-4.5')).toBe(true);
      expect(isValidClaudeModel('claude-haiku-4.5')).toBe(true);
    });

    it('should return true for models starting with claude', () => {
      expect(isValidClaudeModel('claude-test-model')).toBe(true);
      expect(isValidClaudeModel('Claude-Test')).toBe(true);
    });

    it('should return false for non-Claude models', () => {
      expect(isValidClaudeModel('gpt-4')).toBe(false);
      expect(isValidClaudeModel('gemini-pro')).toBe(false);
    });
  });

  describe('getAvailableModels', () => {
    it('should return a list with object type', () => {
      const models = getAvailableModels();
      expect(models.object).toBe('list');
    });

    it('should return an array of models', () => {
      const models = getAvailableModels();
      expect(Array.isArray(models.data)).toBe(true);
      expect(models.data.length).toBeGreaterThan(0);
    });

    it('should include all standard Claude models', () => {
      const models = getAvailableModels();
      const modelIds = models.data.map((m) => m.id);
      
      expect(modelIds).toContain('claude-opus-4-5-20250514');
      expect(modelIds).toContain('claude-sonnet-4-5-20250514');
      expect(modelIds).toContain('claude-haiku-4-5-20250514');
    });

    it('should have correct structure for each model', () => {
      const models = getAvailableModels();
      
      models.data.forEach((model) => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('object');
        expect(model).toHaveProperty('created');
        expect(model).toHaveProperty('owned_by');
        expect(model.object).toBe('model');
        expect(model.owned_by).toBe('anthropic');
      });
    });
  });

  describe('getModelDisplayName', () => {
    it('should return display names for known models', () => {
      expect(getModelDisplayName('claude-opus-4-5-20250514')).toContain('Opus');
      expect(getModelDisplayName('claude-sonnet-4-5-20250514')).toContain('Sonnet');
      expect(getModelDisplayName('claude-haiku-4-5-20250514')).toContain('Haiku');
    });

    it('should generate display name for unknown models', () => {
      const displayName = getModelDisplayName('test-model-123');
      expect(typeof displayName).toBe('string');
      expect(displayName.length).toBeGreaterThan(0);
    });

    it('should capitalize words in generated display names', () => {
      const displayName = getModelDisplayName('my-custom-model');
      expect(displayName).toBe('My Custom Model');
    });
  });
});
