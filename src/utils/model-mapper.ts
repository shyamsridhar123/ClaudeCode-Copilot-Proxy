/**
 * Model mapping utilities for Claude Code -> GitHub Copilot
 * 
 * Supports Claude, GPT, Gemini, and other models available in Copilot
 */

import { CLAUDE_MODEL_MAPPINGS, AVAILABLE_CLAUDE_MODELS } from '../config/index.js';
import { AnthropicModel, AnthropicModelList } from '../types/anthropic.js';

/**
 * Map a model name to the Copilot model name
 * 
 * @param model - The model name (e.g., "claude-opus-4-5-20250514", "gpt-5.2", "gemini-3-pro")
 * @returns The corresponding Copilot model name
 */
export function mapClaudeModelToCopilot(model: string): string {
  // Check if we have a direct mapping for Claude models
  const mapped = CLAUDE_MODEL_MAPPINGS[model];
  if (mapped) {
    return mapped;
  }

  // Check for partial matches (model name might have extra suffix)
  for (const [key, value] of Object.entries(CLAUDE_MODEL_MAPPINGS)) {
    if (model.startsWith(key) || key.startsWith(model)) {
      return value;
    }
  }

  // For non-Claude models (GPT, Gemini, etc.), pass through as-is
  // GitHub Copilot supports multiple model providers
  return model;
}

/**
 * Check if a model is a valid Claude model
 * 
 * @param model - The model name to check
 * @returns True if the model is a known Claude model
 */
export function isValidClaudeModel(model: string): boolean {
  // Check direct mapping
  if (CLAUDE_MODEL_MAPPINGS[model]) {
    return true;
  }

  // Check if it's a Copilot model name
  const copilotModels = Object.values(CLAUDE_MODEL_MAPPINGS);
  if (copilotModels.includes(model)) {
    return true;
  }

  // Check if it starts with 'claude'
  return model.toLowerCase().startsWith('claude');
}

/**
 * Get the list of available Claude models for the /v1/models endpoint
 * 
 * @returns AnthropicModelList compatible response
 */
export function getAvailableModels(): AnthropicModelList {
  const models: AnthropicModel[] = AVAILABLE_CLAUDE_MODELS.map((model) => ({
    id: model.id,
    object: 'model' as const,
    created: Math.floor(Date.now() / 1000),
    owned_by: 'anthropic',
    display_name: model.display_name,
  }));

  return {
    object: 'list',
    data: models,
  };
}

/**
 * Get display name for a model
 * 
 * @param model - The model name
 * @returns Human-readable display name
 */
export function getModelDisplayName(model: string): string {
  const found = AVAILABLE_CLAUDE_MODELS.find(
    (m) => m.id === model || m.copilot_model === model
  );

  if (found) {
    return found.display_name;
  }

  // Generate a display name from the model ID
  return model
    .replace(/-/g, ' ')
    .replace(/(\d+)/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
