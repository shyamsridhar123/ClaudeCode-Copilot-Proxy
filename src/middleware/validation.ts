/**
 * Validation middleware using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { AppError } from './error-handler.js';

/**
 * Middleware factory to validate request body against a Zod schema
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateRequest<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      const validated = schema.parse(req.body);
      
      // Replace request body with validated data
      req.body = validated;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Request validation failed', {
          path: req.path,
          errors: formattedErrors,
        });

        // Create validation error
        const validationError = new Error('Request validation failed') as AppError;
        validationError.status = 400;
        validationError.code = 'VALIDATION_ERROR';
        
        // Send formatted response
        res.status(400).json({
          error: {
            message: 'Request validation failed',
            code: 'VALIDATION_ERROR',
            status: 400,
            details: formattedErrors,
          },
        });
        return;
      }
      
      // Pass other errors to error handler
      next(error);
    }
  };
}

/**
 * Validate query parameters
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateQuery<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated as typeof req.query;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Query parameter validation failed', {
          path: req.path,
          errors: formattedErrors,
        });

        res.status(400).json({
          error: {
            message: 'Query parameter validation failed',
            code: 'VALIDATION_ERROR',
            status: 400,
            details: formattedErrors,
          },
        });
        return;
      }
      
      next(error);
    }
  };
}

/**
 * Validate request params (path parameters)
 * 
 * @param schema - Zod schema to validate against
 * @returns Express middleware function
 */
export function validateParams<T>(schema: z.ZodType<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated as typeof req.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Path parameter validation failed', {
          path: req.path,
          errors: formattedErrors,
        });

        res.status(400).json({
          error: {
            message: 'Path parameter validation failed',
            code: 'VALIDATION_ERROR',
            status: 400,
            details: formattedErrors,
          },
        });
        return;
      }
      
      next(error);
    }
  };
}
