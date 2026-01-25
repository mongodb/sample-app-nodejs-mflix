/**
 * Request Logging Middleware
 *
 * This middleware logs incoming HTTP requests with useful information
 * including method, URL, status code, and response time.
 * It helps with debugging and monitoring application traffic.
 */

import { Request, Response, NextFunction } from "express";
import logger, { logHttpRequest } from "../utils/logger";

/**
 * Express middleware that logs HTTP requests
 *
 * Logs the following information for each request:
 * - HTTP method (GET, POST, PUT, DELETE, etc.)
 * - Request URL
 * - Response status code
 * - Response time in milliseconds
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Record the start time
  const startTime = Date.now();

  // Log request details at debug level when request starts
  logger.debug(`Incoming request: ${req.method} ${req.url}`, {
    headers: {
      "user-agent": req.get("user-agent"),
      "content-type": req.get("content-type"),
    },
    query: Object.keys(req.query).length > 0 ? req.query : undefined,
    ip: req.ip,
  });

  // Log when response finishes
  res.on("finish", () => {
    const responseTime = Date.now() - startTime;
    logHttpRequest(req.method, req.url, res.statusCode, responseTime);
  });

  next();
}
