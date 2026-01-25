/**
 * Logger Utility
 *
 * This module provides a centralized logging solution using Winston.
 * It supports multiple log levels, console and file transports, and
 * environment-aware formatting for better developer and user experience.
 *
 * Log Levels (from highest to lowest priority):
 * - error: Error events that might still allow the application to continue
 * - warn: Potentially harmful situations
 * - info: Informational messages highlighting application progress
 * - http: HTTP request logging
 * - debug: Detailed debug information
 */

import winston from "winston";
import path from "path";

// Define log levels with custom colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "cyan",
};

// Add colors to Winston
winston.addColors(colors);

/**
 * Determine the log level based on environment
 * - In development: show all logs (debug level)
 * - In production: show info and above
 * - In test: show only errors (or suppress entirely)
 */
function getLogLevel(): string {
  const env = process.env.NODE_ENV || "development";
  const envLogLevel = process.env.LOG_LEVEL;

  // Allow explicit override via LOG_LEVEL env var
  if (envLogLevel) {
    return envLogLevel;
  }

  // Default levels based on environment
  switch (env) {
    case "production":
      return "info";
    case "test":
      return "error";
    default:
      return "debug";
  }
}

/**
 * Console format for development - colorized and readable
 */
const devConsoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  })
);

/**
 * Console format for production - structured JSON
 */
const prodConsoleFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

/**
 * File format - JSON for easy parsing
 */
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.uncolorize(),
  winston.format.json()
);

/**
 * Create transports based on environment
 */
function createTransports(): winston.transport[] {
  const env = process.env.NODE_ENV || "development";
  const transports: winston.transport[] = [];

  // Console transport - always enabled except in test
  if (env !== "test") {
    transports.push(
      new winston.transports.Console({
        format: env === "production" ? prodConsoleFormat : devConsoleFormat,
      })
    );
  }

  // File transports - enabled in production and development (not test)
  if (env !== "test") {
    const logsDir = path.join(process.cwd(), "logs");

    // Error log - only errors
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "error.log"),
        level: "error",
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );

    // Combined log - all logs
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, "combined.log"),
        format: fileFormat,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }

  return transports;
}

/**
 * Create the Winston logger instance
 */
const logger = winston.createLogger({
  level: getLogLevel(),
  levels,
  transports: createTransports(),
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Log an HTTP request
 * @param method - HTTP method (GET, POST, etc.)
 * @param url - Request URL
 * @param statusCode - Response status code
 * @param responseTime - Response time in milliseconds
 */
export function logHttpRequest(
  method: string,
  url: string,
  statusCode: number,
  responseTime: number
): void {
  const statusColor =
    statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "http";

  logger.log(statusColor, `${method} ${url} ${statusCode} - ${responseTime}ms`);
}

export default logger;

