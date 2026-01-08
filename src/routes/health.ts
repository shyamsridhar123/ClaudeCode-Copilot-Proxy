/**
 * Health check routes for monitoring and readiness probes
 */

import express from 'express';
import { config } from '../config/index.js';
import { isTokenValid } from '../services/auth-service.js';
import { logger } from '../utils/logger.js';

export const healthRoutes = express.Router();

/**
 * Basic health check - always returns 200 if server is running
 * GET /health
 */
healthRoutes.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    version: config.version,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Liveness probe - checks if the application is alive
 * GET /health/live
 */
healthRoutes.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Readiness probe - checks if the application is ready to serve traffic
 * GET /health/ready
 */
healthRoutes.get('/health/ready', async (_req, res) => {
  try {
    const checks = {
      authenticated: isTokenValid(),
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };

    // Check if memory usage is within acceptable limits (< 1GB)
    const memoryLimitMB = 1024;
    const currentMemoryMB = checks.memoryUsage.heapUsed / 1024 / 1024;
    const memoryOK = currentMemoryMB < memoryLimitMB;

    // Application is ready if it's been up for at least 5 seconds
    const uptimeOK = checks.uptime > 5;

    if (memoryOK && uptimeOK) {
      return res.status(200).json({
        status: 'ready',
        checks: {
          memory: {
            status: 'ok',
            used_mb: Math.round(currentMemoryMB),
            limit_mb: memoryLimitMB,
          },
          uptime: {
            status: 'ok',
            seconds: Math.round(checks.uptime),
          },
          authenticated: checks.authenticated,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Not ready
    res.status(503).json({
      status: 'not ready',
      checks: {
        memory: {
          status: memoryOK ? 'ok' : 'warning',
          used_mb: Math.round(currentMemoryMB),
          limit_mb: memoryLimitMB,
        },
        uptime: {
          status: uptimeOK ? 'ok' : 'warning',
          seconds: Math.round(checks.uptime),
        },
        authenticated: checks.authenticated,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Detailed health status with metrics
 * GET /health/status
 */
healthRoutes.get('/health/status', async (_req, res) => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  res.status(200).json({
    status: 'running',
    version: config.version,
    environment: config.isDevelopment ? 'development' : 'production',
    uptime: {
      seconds: Math.round(uptime),
      formatted: formatUptime(uptime),
    },
    memory: {
      heap_used_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      rss_mb: Math.round(memoryUsage.rss / 1024 / 1024),
      external_mb: Math.round(memoryUsage.external / 1024 / 1024),
    },
    auth: {
      authenticated: isTokenValid(),
    },
    timestamp: new Date().toISOString(),
  });
});

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}
